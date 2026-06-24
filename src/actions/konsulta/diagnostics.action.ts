"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"

export const getDiagnosticCategoriesAction = withErrorHandling(async () => {
  const categories = await prisma.konsultaDiagnosticCategory.findMany({
    orderBy: { name: 'asc' }
  })
  return { message: "Success", data: categories }
})

export const getDiagnosticResultsAction = withErrorHandling(async (consultationTicketId: number) => {
  const results = await prisma.konsultaDiagnosticResult.findMany({
    where: { consultationTicketId },
    include: {
      Category: true
    },
    orderBy: { createdAt: 'desc' }
  })
  return { message: "Success", data: results }
})

export const saveDiagnosticResultAction = withErrorHandling(async (data: {
  userId: number;
  consultationTicketId: number;
  clinicId: number;
  categoryId: number;
  referralFacility?: string;
  labDate?: Date;
  dateAdded?: Date;
  status?: string;
  diagnosticLabFee?: number;
  results: any; // JSON
}) => {
  const newResult = await prisma.konsultaDiagnosticResult.create({
    data: {
      userId: data.userId,
      consultationTicketId: data.consultationTicketId,
      clinicId: data.clinicId,
      categoryId: data.categoryId,
      referralFacility: data.referralFacility,
      labDate: data.labDate,
      dateAdded: data.dateAdded || new Date(),
      status: data.status || "D",
      diagnosticLabFee: data.diagnosticLabFee,
      results: data.results,
    }
  })

  return { message: "Diagnostic result saved successfully", data: newResult }
})

export const deleteDiagnosticResultAction = withErrorHandling(async (id: number) => {
  await prisma.konsultaDiagnosticResult.delete({
    where: { id }
  })
  return { message: "Diagnostic result deleted", data: null }
})
