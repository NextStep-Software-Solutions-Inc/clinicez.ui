"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ncdQuestionnaireSchema, NcdQuestionnaireSchemaType } from "@/schemas/ncd-questionnaire-schema";
import { getCachedSession } from "@/actions/session.action";

export async function updateNcdQuestionnaireAction(
  patientId: number,
  data: NcdQuestionnaireSchemaType
) {
  try {
    const session = await getCachedSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate data
    const parsedData = ncdQuestionnaireSchema.parse(data);

    // Upsert the NCD Questionnaire
    const result = await prisma.patientNcdQuestionnaire.upsert({
      where: { patientId },
      create: {
        patientId,
        ...parsedData,
        id: undefined, // Let DB generate ID
      },
      update: {
        ...parsedData,
        id: undefined, // Do not update ID
      },
    });

    revalidatePath(`/v2/clinic/patients/${patientId}`);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error("Error updating NCD Questionnaire:", error);
    return { success: false, error: "Failed to update NCD Risk Assessment.", data: null };
  }
}
