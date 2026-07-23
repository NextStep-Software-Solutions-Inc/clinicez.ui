"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function getPhysicalExamLibrariesAction() {
  try {
    const data = await prisma.physicalExamLibrary.findMany({
      orderBy: [
        { category: "asc" },
        { code: "asc" },
      ],
    });
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createPhysicalExamLibraryAction(input: {
  category: string;
  code: string;
  description: string;
  libraryStatus?: number;
}) {
  try {
    const data = await prisma.physicalExamLibrary.create({
      data: {
        category: input.category,
        code: input.code,
        description: input.description,
        libraryStatus: input.libraryStatus ?? 1,
      },
    });
    revalidatePath("/super-admin/physical-exam-library");
    return { data };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A library item with this category and code already exists." };
    }
    return { error: error.message };
  }
}

export async function updatePhysicalExamLibraryAction(
  id: string,
  input: {
    category?: string;
    code?: string;
    description?: string;
    libraryStatus?: number;
    isActive?: boolean;
  }
) {
  try {
    const data = await prisma.physicalExamLibrary.update({
      where: { id },
      data: {
        category: input.category,
        code: input.code,
        description: input.description,
        libraryStatus: input.libraryStatus,
        isActive: input.isActive,
      },
    });
    revalidatePath("/super-admin/physical-exam-library");
    return { data };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A library item with this category and code already exists." };
    }
    return { error: error.message };
  }
}

export async function deletePhysicalExamLibraryAction(id: string) {
  try {
    const data = await prisma.physicalExamLibrary.delete({
      where: { id },
    });
    revalidatePath("/super-admin/physical-exam-library");
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
