"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { format } from "date-fns";

export const generateEkasPdfAction = withErrorHandling(
  async ({ ticketId, clinicUid }: { ticketId: number; clinicUid: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const ticket = await prisma.consultationTicket.findUnique({
      where: { id: ticketId, Clinic: { clinicUid } },
      select: {
        id: true,
        caseNumber: true,
        soapTransNo: true,
        konsultaAtcCode: true,
        Clinic: {
          select: {
            name: true,
            ClinicSetting: {
              select: {
                philhealthAccreditationNumber: true,
                facilityName: true
              }
            }
          }
        },
        ClinicPatient: {
          select: {
            Patient: {
              select: {
                dob: true,
                firstName: true,
                lastName: true,
                mobile: true,
              }
            },
            PhilHealthKonsultaEnlistments: {
              orderBy: { year: "desc" },
              take: 1,
              select: {
                memberPin: true,
                dependentPin: true,
                hciCaseNo: true,
                atcCode: true,
              }
            }
          }
        },
        ConsultationTicketHPs: {
          select: {
            HealthCareProvider: {
              select: {
                HPProfile: {
                  select: { title: true, suffix: true }
                },
                User: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        ConsultationDiagnoses: {
          select: {
            id: true,
            createdAt: true,
            HealthCareProvider: {
              select: {
                User: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        Prescriptions: {
          where: { isActive: true, isArchived: false },
          select: {
            Medicines: {
              where: { isActive: true },
              select: { name: true, genericName: true, dosage: true, qty: true, unit: true, frequency: true, duration: true }
            }
          }
        }
      }
    });

    if (!ticket) throw new Error("Consultation ticket not found");
    if (!ticket.ClinicPatient?.Patient) throw new Error("Patient not attached to consultation");

    // 1. Prepare data
    const clinic = ticket.Clinic;
    const patientUser = ticket.ClinicPatient.Patient;
    const enlistment = ticket.ClinicPatient.PhilHealthKonsultaEnlistments?.[0];

    // Find attending physician
    const hp = ticket.ConsultationTicketHPs[0]?.HealthCareProvider;
    const physicianName = hp
      ? `${hp.HPProfile?.title || ""} ${hp.User?.firstName || ""} ${hp.User?.lastName || ""} ${hp.HPProfile?.suffix || ""}`.trim()
      : "";

    // Prescription Data
    const rx = ticket.Prescriptions[0];
    const prescriptionText = rx?.Medicines?.map(
      (m: any) => `${m.genericName || m.name} ${m.dosage || ""} - ${m.qty} ${m.unit || "tabs"}\nSig: ${m.frequency || ""} ${m.duration ? `for ${m.duration}` : ""}`
    ).join("\n\n") || "";

    const patientName = `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim();

    const calculateAge = (dob: Date | null) => {
      if (!dob) return "";
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    };

    const pin = enlistment?.dependentPin || enlistment?.memberPin || "";
    const memberType = enlistment?.dependentPin ? "DEPENDENT" : "MEMBER";

    const patientData = {
      hciName: clinic?.name || "",
      caseNo: ticket.caseNumber || enlistment?.hciCaseNo || "",
      hciAccrNo: clinic?.ClinicSetting?.philhealthAccreditationNumber || "",
      transactionNo: ticket.soapTransNo || "",
      atcCode: ticket.konsultaAtcCode || "",
      patientName: patientName,
      age: calculateAge(ticket.ClinicPatient.Patient.dob),
      mobileNo: patientUser.mobile || "",
      pin: pin,
      membershipCategory: "",
      membershipType: memberType,
      physicianName: physicianName,
      prcLicense: "",
      ptr: "",
      s2No: "",
      prescriptionText: prescriptionText,
      nextDispenseDate: "",
    };

    const diagnostics = ticket.ConsultationDiagnoses.map((diag: any) => ({
      id: diag.id,
      datePerformed: diag.createdAt ? format(diag.createdAt, "MM/dd/yyyy") : "",
      performer: diag.HealthCareProvider?.User ? `${diag.HealthCareProvider.User.firstName} ${diag.HealthCareProvider.User.lastName}` : ""
    }));

    // 2. Load PDF
    const templatePath = path.join(
      process.cwd(),
      "public",
      "pdfs",
      "phr",
      "eKAS_ePresS (PC 2024-0013) FILLABLE.pdf"
    );
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    const setTextField = (fieldName: string, value: string) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value) field.setText(value);
      } catch (e) {
        // ignore
      }
    };

    setTextField("text_hciName", patientData.hciName);
    setTextField("text_caseNo", patientData.caseNo);
    setTextField("text_hciAccrNo", patientData.hciAccrNo);
    setTextField("text_transNo", patientData.transactionNo);
    setTextField("text_atc", patientData.atcCode);
    setTextField("text_patientName", patientData.patientName);
    setTextField("text_patientAge", patientData.age);
    setTextField("text_patientMobile", patientData.mobileNo);
    setTextField("text_memPin", patientData.pin);
    setTextField("text_memCat", patientData.membershipCategory);
    setTextField("text_patientPin", patientData.pin);

    try {
      const memTypeRadio = form.getRadioGroup("radio_group_memType");
      if (patientData.membershipType === "MEMBER") {
        memTypeRadio.select("MM");
      } else if (patientData.membershipType === "DEPENDENT") {
        memTypeRadio.select("DD");
      }
    } catch (e) { }

    diagnostics.forEach((diag: any) => {
      try {
        const checkBox = form.getCheckBox(`checkbox_diag_${diag.id}`);
        if (checkBox) checkBox.check();
        setTextField(`text_diag_${diag.id}_date`, diag.datePerformed);
        setTextField(`text_diag_${diag.id}_performer`, diag.performer);
      } catch (e) { }
    });

    setTextField("textarea_rx", patientData.prescriptionText);
    setTextField("text_nextDespensDate", patientData.nextDispenseDate);
    setTextField("text_physicianName", patientData.physicianName);
    setTextField("text_prcLicense", patientData.prcLicense);
    setTextField("text_ptr", patientData.ptr);
    setTextField("text_s2No", patientData.s2No);

    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString("base64");
    const filename = `EKAS_ePresS_${patientName.replace(/\s+/g, "_")}_${ticket.caseNumber || "Form"}.pdf`;

    return {
      message: "Generated PDF successfully",
      data: { base64, filename },
    };
  }
);
