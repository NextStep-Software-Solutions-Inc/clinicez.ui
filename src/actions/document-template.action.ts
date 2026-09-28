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
  name: string;
  typeId?: number;
  typeKey?: string;
  clinicUid: string;
  htmlContent: string;
};

import { getDocumentTypeNamesForDocumentKey } from "@/lib/resolve-clinic-template";

export const createDocumentTemplateAction = withErrorHandling(async (payload: CreateDocumentTemplatePayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { name, typeId, typeKey, clinicUid, htmlContent } = payload;

  let resolvedTypeId = typeId;
  if (!resolvedTypeId && typeKey) {
    const matchingNames = getDocumentTypeNamesForDocumentKey(typeKey);
    const docType = await prismaClient.documentTemplateType.findFirst({
      where: {
        OR: matchingNames.map((n) => ({
          name: { equals: n, mode: "insensitive" as const },
        })),
      },
      select: { id: true },
    });
    if (docType) {
      resolvedTypeId = docType.id;
    }
  }

  if (!resolvedTypeId) throw new Error("Document template type is required");

  const documentTemplate = await prismaClient.documentTemplate.create({
    data: {
      name,
      htmlContent,
      Clinic: {
        connect: {
          clinicUid,
        },
      },
      DocumentTemplateType: {
        connect: {
          id: resolvedTypeId,
        },
      },
    },
  });
  return { message: "Document template created successfully", data: documentTemplate };
});

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

