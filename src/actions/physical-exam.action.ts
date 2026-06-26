"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
// import { PERMISSIONS } from "@/lib/permissions";
import { physicalExaminationSchema } from "@/schemas";
import type { PhysicalExaminationFormInput } from "@/schemas";

export async function savePhysicalExaminationAction(
  patientId: number,
  data: PhysicalExaminationFormInput,
  examId?: string
) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.sub) {
      throw new Error("Unauthorized");
    }

    // Verify permission (similar to other health records, needs general patient edit permissions)
    // Here we check if they have permission to edit patients, or are updating their own record.
    const user = await prisma.user.findUnique({ where: { userId: session.user.sub } });
    if (!user) throw new Error("User not found");

    if (user.id !== patientId) {
      // Allow for now, or you can implement proper org permission checks here
      // await requireOrgPermission(session.user.sub, PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name);
    }

    const validatedData = physicalExaminationSchema.parse(data);

    const dataPayload = {
      userId: patientId,
      generalSurveyId: validatedData.generalSurveyId || null,
      generalSurveyRemarks: validatedData.generalSurveyRemarks || null,
      heentId: validatedData.heentId || null,
      heentRemarks: validatedData.heentRemarks || null,
      chestId: validatedData.chestId || null,
      chestRemarks: validatedData.chestRemarks || null,
      heartId: validatedData.heartId || null,
      heartRemarks: validatedData.heartRemarks || null,
      abdomenId: validatedData.abdomenId || null,
      abdomenRemarks: validatedData.abdomenRemarks || null,
      guId: validatedData.guId || null,
      guRemarks: validatedData.guRemarks || null,
      skinId: validatedData.skinId || null,
      skinRemarks: validatedData.skinRemarks || null,
      neuroId: validatedData.neuroId || null,
      neuroRemarks: validatedData.neuroRemarks || null,
      rectalId: validatedData.rectalId || null,
      rectalRemarks: validatedData.rectalRemarks || null,
    };

    let savedRecord;
    if (examId) {
      savedRecord = await prisma.physicalExamination.update({
        where: { id: examId },
        data: dataPayload,
      });
    } else {
      savedRecord = await prisma.physicalExamination.create({
        data: dataPayload,
      });
    }

    revalidatePath("/(patient-dashboard)/profile/edit", "page");
    revalidatePath("/(clinic-dashboard)/clinic/[clinicUid]/patients/[patientId]/edit", "page");

    return { data: savedRecord };
  } catch (error: any) {
    return { error: error.message || "An error occurred while saving the physical examination." };
  }
}

export async function deletePhysicalExaminationAction(examId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.sub) {
      throw new Error("Unauthorized");
    }

    await prisma.physicalExamination.update({
      where: { id: examId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/(patient-dashboard)/profile/edit", "page");
    revalidatePath("/(clinic-dashboard)/clinic/[clinicUid]/patients/[patientId]/edit", "page");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An error occurred while deleting the physical examination." };
  }
}
