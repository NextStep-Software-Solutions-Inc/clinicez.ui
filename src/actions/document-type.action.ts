"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "./session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";

export type GetDocumentTypesFilters = {
  name?: string
}
export type GetDocumentTypes = Awaited<ReturnType<typeof getDocumentTypesAction>>
export const getDocumentTypesAction = withErrorHandling(async (filters?: GetDocumentTypesFilters) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  
  const { name } = filters ?? {}
  const documentTemplates = await prismaClient.documentTemplateType.findMany({
    where: {
      ...(name ? { name: { equals: name, mode: "insensitive" } } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          DocumentTemplates: true,
        },
      },
    }
  })
  return {message: "", data: documentTemplates}
})

type UpsertDocumentTypePayload = {
  name: string;
  description?: string | null;
}

export const createDocumentTypeAction = withErrorHandling(async (payload: UpsertDocumentTypePayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const { name, description } = payload
  const documentTemplateType = await prismaClient.documentTemplateType.create({
    data: {
      name,
      description,
    }
  })

  return { message: "Document template type created successfully", data: documentTemplateType }
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2002") return "Document template type already exists"
})

export const updateDocumentTypeAction = withErrorHandling(async (id: number, payload: UpsertDocumentTypePayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const { name, description } = payload
  const documentTemplateType = await prismaClient.documentTemplateType.update({
    where: { id },
    data: {
      name,
      description,
    }
  })

  return { message: "Document template type updated successfully", data: documentTemplateType }
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Document template type not found"
  if(hasCodeProperty(error) && error.code === "P2002") return "Document template type already exists"
})

export const deleteDocumentTypeAction = withErrorHandling(async (id: number) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const documentTemplateType = await prismaClient.documentTemplateType.delete({
    where: { id }
  })

  return { message: "Document template type deleted successfully", data: documentTemplateType }
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Document template type not found"
  if(hasCodeProperty(error) && error.code === "P2003") return "Cannot delete document template type because it is in use"
})