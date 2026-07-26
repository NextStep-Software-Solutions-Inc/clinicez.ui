import { z } from "zod"

/**
 * Demographics Schema - User Profile Information
 * User-centric validation with helpful error messages
 */

// Helper: Validate age is realistic (0-120 years)
const validateAge = (dob: Date | null | undefined) => {
  if (!dob) return true
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return age >= 0 && age <= 120
}

export const demographicsSchema = z.object({
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
    .max(20, "Suffix must be less than 20 characters (e.g., Jr., Sr., III)")
    .optional()
    .nullable(),

  nickname: z
    .string()
    .max(100, "Nickname must be less than 100 characters")
    .optional()
    .nullable(),

  dob: z
    .preprocess(
      (val) => (val ? new Date(val as any) : val),
      z
        .date()
        .refine((d) => d <= new Date(), "Date of birth must be today or earlier")
        .refine(
          (dob) => validateAge(dob),
          "Age must be between 0 and 120 years"
        )
    )
    .optional()
    .nullable(),

  gender: z
    .enum(["MALE", "FEMALE"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    })
    .optional()
    .nullable(),

  bloodType: z
    .enum([
      "O_POSITIVE",
      "O_NEGATIVE",
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "RH_POSITIVE",
      "RH_NEGATIVE",
      "UNKNOWN",
    ], {
      errorMap: () => ({ message: "Please select a valid blood type" }),
    })
    .optional()
    .nullable(),

  civilStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"], {
      errorMap: () => ({ message: "Please select a valid civil status" }),
    })
    .optional()
    .nullable(),

  mobile: z
    .string()
    .regex(/^(\+\d{1,3}[\s-]?)?\d{7,14}$/, "Please enter a valid phone number (7-15 digits)")
    .optional()
    .nullable(),

  telephone: z
    .string()
    .regex(/^(\+\d{1,3}[\s-]?)?\d{7,14}$/, "Please enter a valid phone number (7-15 digits)")
    .optional()
    .nullable(),

  placeOfBirth: z
    .string()
    .max(200, "Place of birth must be less than 200 characters")
    .optional()
    .nullable(),

  nationality: z
    .string()
    .max(100, "Nationality must be less than 100 characters")
    .optional()
    .nullable(),

  religion: z
    .string()
    .max(100, "Religion must be less than 100 characters")
    .optional()
    .nullable(),
})

export type DemographicsFormInput = z.infer<typeof demographicsSchema>

/**
 * Helper function to calculate age from DOB
 * Used for display purposes in forms
 */
export const calculateAge = (dob: Date | null | undefined): number | null => {
  if (!dob) return null
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return age >= 0 && age <= 120 ? age : null
}
