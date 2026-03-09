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
  },
  () => undefined
);