import { z } from "zod"

/**
 * Family Medical History Schema
 * Family members' medical conditions
 * User-centric: condition selection, relationship info in details field
 */

export const familyMedicalHistorySchema = z.object({
  conditionId: z
    .number()
    .int()
    .min(1, "Please select a medical condition"),
  
  details: z
    .string()
    .max(500, "Details must be less than 500 characters. Include: family member relation, their age, condition onset")
    .optional()
    .nullable(),
})

export type FamilyMedicalHistoryFormInput = z.infer<typeof familyMedicalHistorySchema>

/**
 * Schema for managing multiple family medical conditions
 */
export const familyMedicalHistoriesSchema = z.object({
  conditions: z
    .array(familyMedicalHistorySchema)
    .refine(
      (conditions) => {
        // No duplicate conditions
        const conditionIds = conditions.map((c) => c.conditionId)
        return new Set(conditionIds).size === conditionIds.length
      },
      {
        message: "You cannot add the same condition twice (though different family members can have it)",
        path: ["conditions"],
      }
    ),
})

export type FamilyMedicalHistoriesFormInput = z.infer<typeof familyMedicalHistoriesSchema>

/**
 * Helper labels for form guidance
 * User-centric: helps user understand what information is helpful
 */
export const familyMedicalHistoryGuidance = {
  details:
    "Help us understand the family connection. Example: 'Mother - diagnosed at age 45' or 'Maternal grandmother - type 1 diabetic'",
  familyRelationships: [
    "Mother",
    "Father",
    "Sister",
    "Brother",
    "Maternal Grandmother",
    "Maternal Grandfather",
    "Paternal Grandmother",
    "Paternal Grandfather",
    "Aunt",
    "Uncle",
    "Cousin",
    "Other relative",
  ],
}
