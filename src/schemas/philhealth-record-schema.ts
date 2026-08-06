import { z } from "zod"

/**
 * PhilHealthDependent Schema
 * Dependent family members covered under PhilHealth
 */
export const philHealthDependentSchema = z.object({
  id: z.number().int().optional(),
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
    .max(100, "Last name must be less than 100 characters")
    .optional()
    .nullable(),
  suffix: z
    .string()
    .max(20, "Suffix must be less than 20 characters")
    .optional()
    .nullable(),
  relationship: z
    .string()
    .max(50, "Relationship must be less than 50 characters")
    .optional()
    .nullable(),
  dob: z
    .date()
    .optional()
    .nullable(),
  gender: z
    .enum(["MALE", "FEMALE"])
    .optional()
    .nullable(),
  citizenship: z
    .string()
    .max(100, "Citizenship must be less than 100 characters")
    .optional()
    .nullable(),
  isPermanentlyDisabled: z.boolean().default(false).optional(),
})

export type PhilHealthDependentFormInput = z.infer<typeof philHealthDependentSchema>

/**
 * PhilHealth Record Schema
 * Philippine Health Insurance coverage information
 * User-centric: clear explanations of required fields
 */
export const philHealthRecordSchema = z
  .object({
    pin: z
      .string()
      .transform((val) => val.replace(/\D/g, ""))
      .refine((val) => val.length === 12 || val.length === 15, "Patient PIN must be a 12-digit PhilHealth PIN"),

    tin: z
      .string()
      .transform((val) => {
        const digits = val.replace(/\D/g, "");
        return digits === "" ? undefined : digits;
      })
      .optional()
      .nullable()
      .refine((val) => !val || (val.length >= 9 && val.length <= 15), "TIN must be between 9 and 15 digits"),

    philSysId: z
      .string()
      .transform((val) => {
        const digits = val.replace(/\D/g, "");
        return digits === "" ? undefined : digits;
      })
      .optional()
      .nullable()
      .refine((val) => !val || val.length === 12 || val.length === 15, "PhilSys ID must be 12 or 15 digits"),

    dependentPin: z
      .string()
      .transform((val) => {
        const digits = val.replace(/\D/g, "");
        return digits === "" ? undefined : digits;
      })
      .optional()
      .nullable(),

    memberType: z
      .enum(["MM", "DD"])
      .default("MM"),

    photoUrl: z
      .string()
      .url("Photo URL must be a valid URL")
      .optional()
      .nullable(),

    dependents: z
      .array(philHealthDependentSchema)
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.memberType === "DD") {
      if (!data.dependentPin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Principal Member PIN is required for dependent profiles.",
          path: ["dependentPin"],
        });
      } else if (data.dependentPin.length !== 12 && data.dependentPin.length !== 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Principal Member PIN must be a 12-digit PhilHealth PIN.",
          path: ["dependentPin"],
        });
      }

      if (data.pin && data.dependentPin && data.pin === data.dependentPin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Patient PIN and Principal Member PIN cannot be the same.",
          path: ["dependentPin"],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Patient PIN and Principal Member PIN cannot be the same.",
          path: ["pin"],
        });
      }
    }
  });

export type PhilHealthRecordFormInput = z.infer<typeof philHealthRecordSchema>

/**
 * Helper labels for form guidance
 * User-centric: helps users understand what each field means
 */
export const philHealthRecordLabels = {
  pin: "Your PhilHealth ID Number (found on your PhilHealth card)",
  tin: "Tax Identification Number (optional, for employed members)",
  dependentPin: "Your Dependent PIN (if you are a dependent)",
  philSysId: "Philippine System ID (optional, if you have registered)",
  memberType: "Your member category (Principal Member or Dependent)",
  photoUrl: "URL to your PhilHealth card photo (optional)",
}
