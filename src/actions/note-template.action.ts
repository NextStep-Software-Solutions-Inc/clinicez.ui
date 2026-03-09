"use server";

import prisma from "@lib/prisma";

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