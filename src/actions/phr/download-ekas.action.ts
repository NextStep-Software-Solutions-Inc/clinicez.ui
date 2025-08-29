"use server";

import { withErrorHandling } from "@/lib/with-error-handling";
import { getUserAction } from "../users/user.action";
import { generatePdf, PdfCheckboxMapping, PdfTextMapping, resolvePreferredKonsultaProvider } from "./utils/philhealth-pdf";
import { getFullName } from "@/lib/formatter-utils";
import prisma from "@/lib/prisma";
import { PhilHealthRecordBasic, hasPhilHealthRecordBasic, generateCaseNumber, generateTransactionNumber } from "@/lib/utils/philhealth";
import { } from "@/lib/utils";

export const downloadEKASAction = withErrorHandling(async (userId?: string) => {
  if (!userId) return { message: "User ID is required", data: undefined };
  const userRes = await getUserAction(userId);
  const user = userRes.data;
  if (!user) return { message: "User not found", data: undefined };

  const hci = await resolvePreferredKonsultaProvider(userId);
  const fullName = getFullName({
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    lastName: user.lastName ?? "",
    suffix: user.suffix ?? "",
  });
  const age = user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined;

  // PhilHealth Identification Number
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

  const memberType = phr?.PhilHealthMemberType?.name?.toUpperCase() || "N/A";
  const caseNumber = generateCaseNumber();
  const transactionNumber = generateTransactionNumber();

  const texts: PdfTextMapping[] = [
    { field: 'preferredKonsultaProvider', value: hci.toUpperCase() || 'N/A' },
    { field: 'caseNumber', value: caseNumber },
    { field: 'transactionNumber', value: transactionNumber },
    { field: 'memberPin', value: phr?.pin || undefined },
    { field: 'memberType', value: memberType },
    { field: 'memberFullName', value: fullName.toUpperCase() },
    { field: 'memberAge', value: age?.toString() },
    { field: 'mobileNumber', value: user.mobile || 'N/A' },
  ];


  const checkboxes: PdfCheckboxMapping[] = [
    { field: 'checkboxTypeMember', condition: true },
  ];

  const pdf = await generatePdf('Philhealth_EKAS_EPRESS.pdf', texts, checkboxes, `EKAS_${user.firstName || 'Member'}_${user.lastName || ''}`);

  return { message: "EKAS downloaded successfully", data: pdf };
});