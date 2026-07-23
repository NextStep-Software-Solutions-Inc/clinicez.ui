"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSignsAndSymptomsAction() {
  try {
    const data = await prisma.konsultaSignAndSymptom.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { code: 'asc' }
      ]
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching signs and symptoms:", error);
    return { success: false, error: error.message };
  }
}

export async function getActiveSignsAndSymptomsAction() {
  try {
    const data = await prisma.konsultaSignAndSymptom.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { code: 'asc' }
      ]
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching active signs and symptoms:", error);
    return { success: false, error: error.message };
  }
}

export async function upsertSignAndSymptomAction(data: {
  id?: string;
  code: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}) {
  try {
    const { id, code, description, sortOrder, isActive } = data;

    if (id) {
      const updated = await prisma.konsultaSignAndSymptom.update({
        where: { id },
        data: { code, description, sortOrder, isActive },
      });
      revalidatePath("/super-admin/signs-and-symptoms");
      revalidatePath("/(v2)/(main)/clinics/[clinicId]/workspace", "layout");
      return { success: true, data: updated };
    } else {
      const created = await prisma.konsultaSignAndSymptom.create({
        data: { code, description, sortOrder, isActive },
      });
      revalidatePath("/super-admin/signs-and-symptoms");
      revalidatePath("/(v2)/(main)/clinics/[clinicId]/workspace", "layout");
      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("Error upserting sign and symptom:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSignAndSymptomAction(id: string) {
  try {
    await prisma.konsultaSignAndSymptom.delete({
      where: { id },
    });
    revalidatePath("/super-admin/signs-and-symptoms");
    revalidatePath("/(v2)/(main)/clinics/[clinicId]/workspace", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting sign and symptom:", error);
    return { success: false, error: error.message };
  }
}
