"use server";

import prisma from "@lib/prisma-common";


export type GetStudentLevels = Awaited<ReturnType<typeof getStudentLevelsAction>>
export const getStudentLevelsAction = async () => {
  const studentLevels = await prisma.studentLevel.findMany({
    orderBy: { name: "asc" },
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    }
  });
  return studentLevels;
}