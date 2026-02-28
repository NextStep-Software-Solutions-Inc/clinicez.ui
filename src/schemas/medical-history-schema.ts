import { z } from "zod"

/**
 * Medical History Schema
 * Chronic conditions and medical diagnoses
 * User-centric: condition selection from predefined list, optional details
 */

export const medicalHistorySchema = z.object({
  conditionId: z
    .number()
    .int()
    .min(1, "Please select a medical condition"),

  details: z
    .string()
    .max(500, "Details must be less than 500 characters. Include: onset date, severity, treatment, status")
    .optional()
    .nullable(),
})

export type MedicalHistoryFormInput = z.infer<typeof medicalHistorySchema>

/**
 * Schema for managing multiple medical conditions
 */
export const medicalHistoriesSchema = z.object({
  conditions: z
    .array(medicalHistorySchema)
    .refine(
      (conditions) => {
        // No duplicate conditions
        const conditionIds = conditions.map((c) => c.conditionId)
        return new Set(conditionIds).size === conditionIds.length
      },
      {
        message: "You cannot add the same condition twice",
        path: ["conditions"],
      }
    ),
})

export type MedicalHistoriesFormInput = z.infer<typeof medicalHistoriesSchema>

/**
 * Helper labels for form guidance
 */
export const medicalHistoryGuidance = {
  details: "Optionally include when the condition started, current treatment, or its impact on daily life",
}
