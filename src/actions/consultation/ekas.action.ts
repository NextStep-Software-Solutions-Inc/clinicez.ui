"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { PDFDocument, PDFName, PDFArray, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { format } from "date-fns";

async function fetchConsultationData(ticketId: number, clinicUid: string) {
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
          id: true,
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
              ProfessionalDetails: {
                select: { licenseNumber: true, ptrNumber: true }
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
            select: {
              name: true,
              genericName: true,
              dosage: true,
              qty: true,
              unit: true,
              frequency: true,
              duration: true,
              PhilHealthData: {
                select: {
                  drugCode: true,
                  genericCode: true,
                }
              }
            }
          }
        }
      }
    }
  });

  if (!ticket) throw new Error("Consultation ticket not fouPnd");
  if (!ticket.ClinicPatient?.Patient) throw new Error("Patient not attached to consultation");

  // Fetch all diagnostic results for this consultation ticket OR for this patient
  const diagnosticResults = await prisma.konsultaDiagnosticResult.findMany({
    where: {
      OR: [
        { consultationTicketId: ticket.id },
        { clinicPatientId: ticket.ClinicPatient.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      resultType: true,
      resultData: true,
      transDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...ticket,
    ClinicPatient: ticket.ClinicPatient!,
    KonsultaDiagnosticResults: diagnosticResults,
  };
}

const EXAM_TYPE_TO_SERVICE_CODE: Record<string, number> = {
  CBC: 1,
  LIPIDPROFILE: 2,
  FBS: 3,
  RBS: 3,
  OGTT: 4,
  HBA1C: 5,
  HBA1CTEST: 5,
  CREATININE: 6,
  CHESTXRAY: 7,
  CHESTXRAYTEST: 7,
  SPUTUM: 8,
  SPUTUMMICROSCOPY: 8,
  ECG: 9,
  URINALYSIS: 13,
  PAPSMEAR: 14,
  FECALYSIS: 15,
  FOBT: 18,
};

type ConsultationData = Awaited<ReturnType<typeof fetchConsultationData>>;

async function prepareFilledPdf(ticket: ConsultationData, templateFileName: string) {
  const clinic = ticket.Clinic;
  const patientUser = ticket.ClinicPatient.Patient;
  const enlistment = ticket.ClinicPatient.PhilHealthKonsultaEnlistments?.[0];

  const hp = ticket.ConsultationTicketHPs[0]?.HealthCareProvider;
  const hpProfile = hp?.HPProfile;
  const profDetails = hp?.ProfessionalDetails;
  const physicianName = hp
    ? `${hpProfile?.title || ""} ${hp.User?.firstName || ""} ${hp.User?.lastName || ""} ${hpProfile?.suffix || ""}`.trim()
    : "";

  const activeMedicines = ticket.Prescriptions?.flatMap((rx) => rx.Medicines || []) || [];
  const actualMedicines = activeMedicines.filter((m) => {
    const isNomed =
      m.name?.toUpperCase() === "NOMED" ||
      m.genericName?.toUpperCase() === "NOMED" ||
      m.PhilHealthData?.genericCode?.toUpperCase() === "NOMED" ||
      m.PhilHealthData?.drugCode?.toUpperCase().startsWith("NOMED");
    return !isNomed;
  });

  const prescriptionText = actualMedicines
    .map(
      (m) => `${m.genericName || m.name} ${m.dosage || ""} - ${m.qty} ${m.unit || "tabs"}\nSig: ${m.frequency || ""} ${m.duration ? `for ${m.duration}` : ""}`
    )
    .join("\n\n");

  const patientName = `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim();

  const calculateAge = (dob: Date | null) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : "";
  };

  const pin = enlistment?.dependentPin || enlistment?.memberPin || "";
  const memberType = enlistment?.dependentPin ? "DEPENDENT" : "MEMBER";

  const isEpress = templateFileName.toLowerCase().includes("epress");
  const hasActualMedicines = actualMedicines.length > 0;

  const shouldBlankPhysician = isEpress && !hasActualMedicines;

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
    physicianName: shouldBlankPhysician ? "" : physicianName,
    prcLicense: shouldBlankPhysician ? "" : (profDetails?.licenseNumber || ""),
    ptr: shouldBlankPhysician ? "" : (profDetails?.ptrNumber || ""),
    s2No: "",
    prescriptionText: prescriptionText,
    nextDispenseDate: "",
  };

  const templatePath = path.join(process.cwd(), "public", "pdfs", "phr", templateFileName);
  const existingPdfBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const form = pdfDoc.getForm();

  const setTextField = (fieldName: string, value: string) => {
    try {
      const field = form.getTextField(fieldName);
      if (field) field.setText(value || "");
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

  // Fix template bug for Row 9 (ECG) where Date box Widget 0 was attached to text_diag_9_performer
  try {
    const perfField = form.getTextField("text_diag_9_performer");
    const widgets = perfField.acroField.getWidgets();

    if (widgets.length >= 2) {
      const dateWidget = widgets[0];

      // 1. Remove dateWidget (Widget 0) from perfField acroField Kids array
      const kids = perfField.acroField.dict.get(PDFName.of("Kids"));
      if (kids instanceof PDFArray) {
        kids.remove(0);
      }

      // 2. Remove dateWidget from Page 0 Annots array
      const page0 = pdfDoc.getPages()[0];
      const annots = page0.node.Annots();
      if (annots) {
        const dateWidgetRef = pdfDoc.context.getObjectRef(dateWidget.dict);
        if (dateWidgetRef) {
          const idx = annots.indexOf(dateWidgetRef);
          if (typeof idx === "number" && idx >= 0) {
            annots.remove(idx);
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Map KonsultaDiagnosticResults to eKAS PDF Checkboxes and Tables
  // Note: The PDF fillable template has swapped/mismatched field names relative to PhilHealth service codes.
  // This map matches PhilHealth service codes to the actual physical form fields in "eKAS (PC 2024-0013) FILLABLE.pdf".
  const SERVICE_CODE_TO_PDF_FIELDS: Record<number, { cb: string; date: string; perf: string }> = {
    1:  { cb: "checkbox_diag_1",  date: "text_diag_1_date",  perf: "text_diag_1_performer" },  // CBC (Row 1)
    2:  { cb: "checkbox_diag_6",  date: "text_diag_6_date",  perf: "text_diag_6_performer" },  // Lipid profile (Row 2)
    3:  { cb: "checkbox_diag_7",  date: "text_diag_7_date",  perf: "text_diag_7_performer" },  // FBS (Row 3)
    4:  { cb: "checkbox_diag_14", date: "text_diag_14_date", perf: "text_diag_14_performer" }, // OGTT (Row 4)
    5:  { cb: "checkbox_18",      date: "text_diag_18_date", perf: "text_diag_18_performer" }, // HbA1c (Row 5)
    6:  { cb: "checkbox_diag_8",  date: "text_diag_8_date",  perf: "text_diag_8_performer" },  // Creatinine (Row 6)
    7:  { cb: "checkbox_diag_4",  date: "text_diag_4_date",  perf: "text_diag_4_performer" },  // Chest X-Ray (Row 7)
    8:  { cb: "checkbox_diag_5",  date: "text_diag_5_date",  perf: "text_diag_5_performer" },  // Sputum (Row 8)
    9:  { cb: "checkbox_diag_9",  date: "text_diag_9_date",  perf: "text_diag_9_performer" },  // ECG (Row 9)
    13: { cb: "checkbox_diag_2",  date: "text_diag_2_date",  perf: "text_diag_2_performer" },  // Urinalysis (Row 10)
    14: { cb: "checkbox_diag_13", date: "text_diag_13_date", perf: "text_diag_13_performer" }, // Pap smear (Row 11)
    15: { cb: "checkbox_diag_3",  date: "text_diag_3_date",  perf: "text_diag_3_performer" },  // Fecalysis (Row 12)
    18: { cb: "checkbox_diag_15", date: "text_diag_15_date", perf: "text_diag_15_performer" }, // FOBT (Row 13)
  };

  let ecgDateToDraw: string | null = null;

  const diagResults = ticket.KonsultaDiagnosticResults || [];
  for (const diag of diagResults) {
    const typeClean = (diag.resultType || "").toUpperCase().replace(/[\s\-_]/g, "");
    const serviceCode = EXAM_TYPE_TO_SERVICE_CODE[typeClean];
    const pdfFields = serviceCode ? SERVICE_CODE_TO_PDF_FIELDS[serviceCode] : null;

    if (pdfFields) {
      try {
        const checkBox = form.getCheckBox(pdfFields.cb);
        if (checkBox) checkBox.check();

        const resultDataObj = diag.resultData as Record<string, any> | null;
        const rawDate = resultDataObj?.labDate || diag.transDate || diag.createdAt;
        const dateVal = rawDate ? format(new Date(rawDate), "MM/dd/yyyy") : "";

        const performerVal =
          resultDataObj?.performer ||
          resultDataObj?.performedBy ||
          patientData.physicianName;

        setTextField(pdfFields.perf, performerVal);

        if (serviceCode === 9) {
          if (dateVal) ecgDateToDraw = dateVal;
        } else {
          setTextField(pdfFields.date, dateVal);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  setTextField("textarea_rx", patientData.prescriptionText);
  setTextField("text_nextDispenseDate", patientData.nextDispenseDate);
  setTextField("text_physicianName", patientData.physicianName);
  setTextField("text_prcLicense", patientData.prcLicense);
  setTextField("text_ptr", patientData.ptr);
  setTextField("text_s2No", patientData.s2No);

  try {
    form.updateFieldAppearances();
  } catch (e) {
    // ignore
  }

  if (ecgDateToDraw) {
    try {
      const page0 = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page0.drawText(ecgDateToDraw, {
        x: 408.24 + 4,
        y: 306.65 + 5,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (e) {
      // ignore
    }
  }

  const filledBytes = await pdfDoc.save();
  return { filledBytes, patientName, caseNumber: ticket.caseNumber };
}

export const generateEkasPdfAction = withErrorHandling(
  async ({ ticketId, clinicUid }: { ticketId: number; clinicUid: string }) => {
    const ticket = await fetchConsultationData(ticketId, clinicUid);
    const { filledBytes, patientName, caseNumber } = await prepareFilledPdf(
      ticket,
      "eKAS (PC 2024-0013) FILLABLE.pdf"
    );

    const base64 = Buffer.from(filledBytes).toString("base64");
    const filename = `EKAS_${patientName.replace(/\s+/g, "_")}_${caseNumber || "Form"}.pdf`;

    return {
      message: "Generated eKAS PDF successfully",
      data: { base64, filename },
    };
  }
);

export const generateEpressPdfAction = withErrorHandling(
  async ({ ticketId, clinicUid }: { ticketId: number; clinicUid: string }) => {
    const ticket = await fetchConsultationData(ticketId, clinicUid);
    const { filledBytes, patientName, caseNumber } = await prepareFilledPdf(
      ticket,
      "ePresS (PC 2024-0013) FILLABLE.pdf"
    );

    const base64 = Buffer.from(filledBytes).toString("base64");
    const filename = `EPRESS_${patientName.replace(/\s+/g, "_")}_${caseNumber || "Form"}.pdf`;

    return {
      message: "Generated ePRESS PDF successfully",
      data: { base64, filename },
    };
  }
);
