"use server"

import { withErrorHandling } from "@/lib/with-error-handling";
import { generatePdf, PdfCheckboxMapping, PdfRadioMapping, PdfTextMapping } from "./utils/philhealth-pdf";
import prisma from "@/lib/prisma";
import { calculateAge, capitalize, centimeterToInch, kilogramsToPounds } from "@/lib/utils";
import { formatDate } from "@/lib/day-utils";

export const downloadConsultationAction = withErrorHandling(async (userId?: string) => {
  if (!userId) throw new Error("User ID is required to generate Consultation Form");

  const phr = await prisma.user.findFirst({
    where: { userId, isActive: true, deletedAt: null },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      dob: true,  // date of birth
      gender: true, // sex,
      VitalSigns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          height: true, // in centimeters
          weight: true, // in kilograms
          temp: true,   // temperature
          bpSystolic: true,
          bpDiastolic: true,
          pulseRate: true,
          respRate: true,
          bmi: true,
          spo2: true, // oxygen saturation
        }
      },
      PhilHealthRecords: {
        where: { isActive: true },
        select: {
          PhilHealthMemberType: {
            select: { name: true }
          },
          pin: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1
      },
      AppointmentRequesters: {
        select: {
          Appointment: {
            select: {
              complaint: true,
            }
          }
        }
      }
    }
  })

  const texts: PdfTextMapping[] = [
    { field: "dateConsultation", value: "" },
    { field: "coPayment", value: "" },
    { field: "memberPin", value: phr?.PhilHealthRecords?.[0]?.pin || "" },
    { field: "memberLastName", value: phr?.lastName || "" },
    { field: "memberFirstName", value: phr?.firstName || "" },
    { field: "memberMiddleName", value: phr?.middleName || "" },
    { field: "memberExtensionName", value: phr?.suffix || "" },
    { field: "memberAge", value: phr?.dob ? calculateAge(phr.dob).toString() : "" },
    { field: "memberDateOfBirth", value: formatDate(phr?.dob) },
    { field: "memberSex", value: phr?.gender ? capitalize(phr.gender) : "" },
    { field: "memberType", value: phr?.PhilHealthRecords?.[0]?.PhilHealthMemberType?.name || "" },
    { field: "chiefComplaint", value: phr?.AppointmentRequesters?.[0]?.Appointment?.complaint || "" },
    { field: "historyOfPresentIllness", value: "" },
    { field: "heightCM", value: phr?.VitalSigns?.[0]?.height?.toString() || "" },
    { field: "heightIN", value: centimeterToInch(phr?.VitalSigns?.[0]?.height || 0).toString() },
    { field: "weightKG", value: phr?.VitalSigns?.[0]?.weight?.toString() || "" },
    { field: "weightLB", value: kilogramsToPounds(phr?.VitalSigns?.[0]?.weight || 0).toString() },
    { field: "physicalExaminationTemperature", value: phr?.VitalSigns?.[0]?.temp?.toString() || "" },
    { field: "physicalExaminationBmi", value: phr?.VitalSigns?.[0]?.bmi ? phr.VitalSigns[0].bmi.toFixed(2) : "" },
    { field: "generalSurvey", value: "" },
    { field: "physicalExaminationBp_1", value: phr?.VitalSigns?.[0]?.bpSystolic?.toString() || "" },
    { field: "physicalExaminationBp_2", value: phr?.VitalSigns?.[0]?.bpDiastolic?.toString() || "" },
    { field: "physicalExaminationHeartRate", value: phr?.VitalSigns?.[0]?.pulseRate?.toString() || "" },
    { field: "physicalExaminationRespiratoryRate", value: phr?.VitalSigns?.[0]?.respRate?.toString() || "" },
    { field: "physicalExaminationVisual_1", value: "" },
    { field: "physicalExaminationVisual_2", value: "" },
    { field: "physicalExaminationHeent", value: "" },
    { field: "physicalExaminationChestBreastLungs", value: "" },
    { field: "physicalExaminationHeart", value: "" },
    { field: "physicalExaminationAbdomen", value: "" },
    { field: "physicalExaminationGeni", value: "" },
    { field: "physicalExaminationDGE", value: "" },
    { field: "physicalExaminationSkin", value: "" },
    { field: "physicalExaminationNeuro", value: "" },
    { field: "assessmentDiagnosis", value: "" },
    { field: "icd10Diagnosis", value: "" },
    { field: "drugMedication", value: "" },
    { field: "laboratory TestDiagnostic", value: "" },
    { field: "medicineDispensingPersonnel", value: "" },
    { field: "attendingPhysician", value: "" },
  ];

  const checkboxes: PdfCheckboxMapping[] = [
  ];

  const radios: PdfRadioMapping[] = []

  const pdf = await generatePdf(
    "PhilHealth_Consultation_Form.pdf",
    texts,
    checkboxes,
    `ConsultationForm_${phr?.firstName || "Member"}_${phr?.lastName || ""}`,
    undefined,
    radios
  );

  return { message: "Consultation Form populated successfully", data: pdf };
})
