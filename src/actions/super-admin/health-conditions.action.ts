"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function getHealthConditionsAction() {
  try {
    const data = await prisma.healthCondition.findMany({
      orderBy: { code: "asc" },
    });
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createHealthConditionAction(input: {
  code?: string;
  name: string;
  libraryStatus?: number;
}) {
  try {
    const data = await prisma.healthCondition.create({
      data: {
        name: input.name,
        code: input.code || null,
        libraryStatus: input.libraryStatus || 1,
      },
    });
    revalidatePath("/super-admin/health-conditions");
    return { data };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Health condition with this name or code already exists." };
    }
    return { error: error.message };
  }
}

export async function updateHealthConditionAction(
  id: number,
  input: {
    code?: string;
    name?: string;
    libraryStatus?: number;
    isActive?: boolean;
  }
) {
  try {
    const data = await prisma.healthCondition.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.code !== undefined && { code: input.code || null }),
        ...(input.libraryStatus !== undefined && { libraryStatus: input.libraryStatus }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    revalidatePath("/super-admin/health-conditions");
    return { data };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Health condition with this name or code already exists." };
    }
    return { error: error.message };
  }
}

export async function deleteHealthConditionAction(id: number) {
  try {
    const data = await prisma.healthCondition.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
    revalidatePath("/super-admin/health-conditions");
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
