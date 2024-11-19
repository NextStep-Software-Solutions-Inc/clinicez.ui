"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "./session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetDocumentTypesFilters = {
  name?: string
}
export type GetDocumentTypes = Awaited<ReturnType<typeof getDocumentTypesAction>>
export const getDocumentTypesAction = withErrorHandling(async (filters: GetDocumentTypesFilters) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  
  const { name } = filters
  const documentTemplates = await prismaClient.documentTemplateType.findMany({
    where: {
      name
    },
    select: {
      id: true,
      name: true,
    }
  })
  return {message: "", data: documentTemplates}
})