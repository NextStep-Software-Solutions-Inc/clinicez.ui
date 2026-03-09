"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@lib/with-error-handling";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";

export type GetNoteTemplates = Awaited<ReturnType<typeof getNoteTemplatesAction>>
export const getNoteTemplatesAction = async () => {
  const plans = await prisma.noteTemplate.findMany({
    where: {
      isActive: true
    }
  });
  return plans;
};

export type GetNoteTemplate = Awaited<ReturnType<typeof getNoteTemplateAction>>
export const getNoteTemplateAction = async (name: string) => {
  const sections = await prisma.noteTemplate.findUnique({
    where: {
      name
    },
    include: {
      NoteSections: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    }
  });
  return sections;
}

export const getNoteTemplatesWithSectionsAction = async () => {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }
  return await prisma.noteTemplate.findMany({
    include: {
      NoteSections: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
};

export type GetNoteTemplatesWithSections = Awaited<ReturnType<typeof getNoteTemplatesWithSectionsAction>>

type SectionSortUpdate = { id: number; sortOrder: number };

export const updateNoteSectionsSortOrderAction = withErrorHandling(
  async (sections: SectionSortUpdate[]) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      throw new Error("Unauthorized: Only super admins can access this resource");
    }
    await prisma.$transaction(
      sections.map(({ id, sortOrder }) =>
        prisma.noteSection.update({ where: { id }, data: { sortOrder } })
      )
    );
    return { message: "Section order updated", data: null };
  },
  () => undefined
);

// --- NoteTemplate CRUD ---

export const createNoteTemplateAction = withErrorHandling(
  async ({ name }: { name: string }) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    const template = await prisma.noteTemplate.create({ data: { name } });
    return { message: "Note template created", data: template };
  },
  () => undefined
);

export const updateNoteTemplateAction = withErrorHandling(
  async ({ id, name, isActive }: { id: number; name?: string; isActive?: boolean }) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    const template = await prisma.noteTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    return { message: "Note template updated", data: template };
  },
  () => undefined
);

export const deleteNoteTemplateAction = withErrorHandling(
  async (id: number) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    await prisma.noteTemplate.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    return { message: "Note template deleted", data: null };
  },
  () => undefined
);

// --- NoteSection CRUD ---

type CreateNoteSectionPayload = {
  noteTemplateId: number;
  name: string;
  label: string;
  description?: string;
  showOnPatient: boolean;
};

export const createNoteSectionAction = withErrorHandling(
  async ({ noteTemplateId, name, label, description, showOnPatient }: CreateNoteSectionPayload) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    const agg = await prisma.noteSection.aggregate({
      where: { noteTemplateId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (agg._max.sortOrder ?? -1) + 1;
    const section = await prisma.noteSection.create({
      data: { noteTemplateId, name, label, description, showOnPatient, sortOrder: nextSortOrder },
    });
    return { message: "Section created", data: section };
  },
  () => undefined
);

type UpdateNoteSectionPayload = {
  id: number;
  name?: string;
  label?: string;
  description?: string;
  showOnPatient?: boolean;
  isActive?: boolean;
};

export const updateNoteSectionAction = withErrorHandling(
  async ({ id, name, label, description, showOnPatient, isActive }: UpdateNoteSectionPayload) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    const section = await prisma.noteSection.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(showOnPatient !== undefined ? { showOnPatient } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    return { message: "Section updated", data: section };
  },
  () => undefined
);

export const deleteNoteSectionAction = withErrorHandling(
  async (id: number) => {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");
    await prisma.noteSection.delete({ where: { id } });
    return { message: "Section deleted", data: null };
  },
  () => undefined
);