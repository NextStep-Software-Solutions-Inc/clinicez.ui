"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "./session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";

export type GetDocumentTemplatesFilters = {
    typeName?: string
    clinicUid?: string
}
export type GetDocumentTemplates = Awaited<ReturnType<typeof getDocumentTemplatesAction>>
export const getDocumentTemplatesAction = withErrorHandling(async (filters: GetDocumentTemplatesFilters) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  
  const { typeName, clinicUid } = filters
  const documentTemplates = await prismaClient.documentTemplate.findMany({
    where: {
      ...(clinicUid ? {
        Clinic: {
          clinicUid
        }
      } : {}),
      isActive: true,
      ...(typeName ? {
        DocumentTemplateType: {
          name: typeName
        }
      } : {})
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      htmlContent: true,
      DocumentTemplateType: {
        select: {
          id: true,
          name: true
        }
      },
    }
  })
  return {message: "", data: documentTemplates}
})

export type GetDocumentTemplateById = Awaited<ReturnType<typeof getDocumentTemplateByIdAction>>
export const getDocumentTemplateByIdAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const documentTemplate = await prismaClient.documentTemplate.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      createdAt: true,
      htmlContent: true,
      DocumentTemplateType: {
        select: { id: true, name: true }
      },
    }
  })
  if (!documentTemplate) throw new Error("Document template not found")
  return { message: "", data: documentTemplate }
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Document template not found"
});

type CreateDocumentTemplatePayload = {
  name: string,
  typeId: number,
  clinicUid: string
  htmlContent: string
}

export const createDocumentTemplateAction = withErrorHandling(async (payload: CreateDocumentTemplatePayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const { name, typeId, clinicUid, htmlContent } = payload
  const documentTemplate = await prismaClient.documentTemplate.create({
    data: {
      name,
      htmlContent,
      Clinic: {
        connect: {
          clinicUid
        }
      },
      DocumentTemplateType: {
        connect: {
          id: typeId
        }
      }
    }
  })
  return {message: "Document template created successfully", data: documentTemplate}
})

type UpdateDocumentTemplatePayload = {
  id: number,
  name: string,
  htmlContent: string
}
export const updateDocumentTemplateAction = withErrorHandling(async (payload: UpdateDocumentTemplatePayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const { id, name, htmlContent } = payload
  const documentTemplate = await prismaClient.documentTemplate.update({
    where: {
      isActive: true,
      id
    },
    data: {
      name,
      htmlContent
    }
  })
  return {message: "Document template updated successfully", data: documentTemplate}
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Document template not found"
});

export const deleteDocumentTemplateAction = withErrorHandling(async (id: number) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const documentTemplate = await prismaClient.documentTemplate.update({
    where: {
      isActive: true,
      id
    },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  })
  return {message: "Document template deleted successfully", data: documentTemplate}
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Document template not found"
});

