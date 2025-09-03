"use server";

import { withErrorHandling } from "@/lib/with-error-handling";
import { getUserAction } from "../users/user.action";
import { getFullName } from "@/lib/formatter-utils";
import { generatePdf, PdfTextMapping, PdfCheckboxMapping, resolvePreferredKonsultaProvider } from "./utils/philhealth-pdf";
import prisma from "@/lib/prisma";
import { PhilHealthRecordBasic, hasPhilHealthRecordBasic, generateCaseNumber } from "@/lib/utils/philhealth";
import { getUserVitalSignsAction } from "../vitals.action";

export const downloadHAFAction = withErrorHandling(async (userId: string) => {
  if (!userId) throw new Error("User ID is required");
  const userRes = await getUserAction(userId);
  const user = userRes.data;
  if (!user) throw new Error("User not found");

  // Get PhilHealth record
  let phr: PhilHealthRecordBasic | undefined = hasPhilHealthRecordBasic(user) ? user.PhilHealthRecord?.[0] : undefined
  if (!phr && user.id) {
    const fetched = await prisma.philHealthRecord.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: {
        pin: true,
        philSysId: true,
        tin: true,
        PhilHealthMemberType: { select: { name: true } },
      },
    })
    phr = fetched ?? undefined
  }

  const age = user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined;
  const memberType = phr?.PhilHealthMemberType?.name?.toUpperCase() || "N/A";
  const caseNumber = generateCaseNumber();

  const vitals = await getUserVitalSignsAction(userId);

  // Format date of birth
  const dobDate = user.dob ? new Date(user.dob) : undefined;
  const dobFormatted = dobDate ? dobDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }) : "";

  // TODO: Add the remaining missing texts, checkboxes, and radioboxes.
  const texts: PdfTextMapping[] = [
    { field: 'caseNumber', value: caseNumber },
    { field: 'memberPin', value: phr?.pin || "" },
    { field: 'memberLastName', value: user.lastName?.toUpperCase() || "" },
    { field: 'memberFirstName', value: user.firstName?.toUpperCase() || "" },
    { field: 'memberMiddleName', value: user.middleName?.toUpperCase() || "" },
    { field: 'memberExtensionName', value: user.suffix?.toUpperCase() || "" },
    { field: 'memberAge', value: age?.toString() || "" },
    { field: 'memberSex', value: user.gender?.toUpperCase() || "" },
    { field: 'memberType', value: memberType },
    { field: 'memberDateOfBirth', value: dobFormatted },
    {
      field: 'dateScreeningAndAssessment', value: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    },
  ];

  const checkboxes: PdfCheckboxMapping[] = [
    { field: 'pastMedicalHistoryNone', condition: true },
    { field: 'familyHistoryNone', condition: true },
  ];

  const pdf = await generatePdf('PhilHealth_HAF.pdf', texts, checkboxes, `HAF_${user.firstName || 'Member'}_${user.lastName || ''}`);

  return { message: "Downloaded Health Assessment Form successfully", data: pdf };
});