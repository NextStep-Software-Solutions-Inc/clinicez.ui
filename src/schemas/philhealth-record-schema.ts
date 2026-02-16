import { z } from "zod"

/**
 * PhilHealth Record Schema
 * Philippine Health Insurance coverage information
 * User-centric: clear explanations of required fields
 */

export const philHealthRecordSchema = z.object({
  pin: z
    .string()
    .min(1, "PIN (PhilHealth ID Number) is required")
    .max(50, "PIN must be less than 50 characters"),

  tin: z
    .string()
    .max(50, "TIN (Tax Identification Number) must be less than 50 characters")
    .optional()
    .nullable(),

  philSysId: z
    .string()
    .max(50, "PhilSys ID must be less than 50 characters")
    .optional()
    .nullable(),

  memberTypeId: z
    .number()
    .int()
    .optional()
    .nullable(),

  photoUrl: z
    .string()
    .url("Photo URL must be a valid URL")
    .optional()
    .nullable(),
})

export type PhilHealthRecordFormInput = z.infer<typeof philHealthRecordSchema>

/**
 * Helper labels for form guidance
 * User-centric: helps users understand what each field means
 */
export const philHealthRecordLabels = {
  pin: "Your PhilHealth ID Number (found on your PhilHealth card)",
  tin: "Tax Identification Number (optional, for employed members)",
  philSysId: "Philippine System ID (optional, if you have registered)",
  memberTypeId: "Your member category (e.g., Individual, Employed, Self-Employed)",
  photoUrl: "URL to your PhilHealth card photo (optional)",
}

/**
 * PhilHealth Member Types
 * These should match the database HealthcareProvider types
 */
export const philHealthMemberTypes = [
  { id: 1, name: "Individual", description: "Self-paying member" },
  { id: 2, name: "Employed", description: "Member through employer" },
  { id: 3, name: "Self-Employed", description: "Self-employed professional" },
  { id: 4, name: "Senior Citizen", description: "Senior citizen member" },
  { id: 5, name: "PWD", description: "Person with disability" },
  { id: 6, name: "Indigent", description: "Indigent/sponsored member" },
  { id: 7, name: "Lifetime Member", description: "Lifetime member" },
]
