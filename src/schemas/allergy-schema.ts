import { z } from "zod"

/**
 * Allergy Schema - User Allergy Information
 * Validates allergy data for creation and updates
 */

export const allergySchema = z.object({
    id: z.number().optional(),
    allergen: z
        .string()
        .min(1, "Allergen name is required")
        .max(200, "Allergen name must be less than 200 characters"),

    reaction: z
        .string()
        .min(1, "Reaction description is required")
        .max(500, "Reaction description must be less than 500 characters"),

    notes: z
        .string()
        .max(1000, "Notes must be less than 1000 characters")
        .optional()
        .nullable(),
})

export type AllergyFormInput = z.infer<typeof allergySchema>

/**
 * Array schema for multiple allergies
 */
export const allergiesListSchema = z.array(allergySchema)

export type AllergiesList = z.infer<typeof allergiesListSchema>
