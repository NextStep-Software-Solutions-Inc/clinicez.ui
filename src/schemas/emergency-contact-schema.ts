import { z } from "zod"

/**
 * Emergency Contact Schema - User Emergency Contact Information
 * Validates emergency contact data for creation and updates
 */

export const emergencyContactSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Full name must be less than 200 characters"),

  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),

  middleName: z
    .string()
    .max(100, "Middle name must be less than 100 characters")
    .optional()
    .nullable(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),

  suffix: z
    .string()
    .max(20, "Suffix must be less than 20 characters")
    .optional()
    .nullable(),

  relationship: z
    .string()
    .min(1, "Relationship is required")
    .max(50, "Relationship must be less than 50 characters"),

  phone: z
    .string()
    .regex(/^(\+\d{1,3}[\s-]?)?\d{7,14}$/, "Please enter a valid phone number (7-15 digits)")
    .min(7, "Phone number must be at least 7 digits"),

  isPrimary: z.boolean().default(false),

  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .nullable(),
})

export type EmergencyContactFormInput = z.infer<typeof emergencyContactSchema>

/**
 * Array schema for multiple emergency contacts
 */
export const emergencyContactsListSchema = z.array(emergencyContactSchema)

export type EmergencyContactsList = z.infer<typeof emergencyContactsListSchema>
