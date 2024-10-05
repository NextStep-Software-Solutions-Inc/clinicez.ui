"use server";

import prisma from "@lib/prisma-common";

export type GetNoteTemplates = Awaited<ReturnType<typeof getNoteTemplatesAction>>
export const getNoteTemplatesAction = async () => {
  const plans = await prisma.noteTemplate.findMany({
    where: {
      isActive: true
    },
  });
  return plans;
};