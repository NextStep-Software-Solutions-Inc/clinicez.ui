import { z } from "zod"

/**
 * OB/GYN History Schema
 * Female reproductive history - conditional visibility based on gender
 * User-centric: clear field descriptions, realistic ranges
 */

export const obGyneHistorySchema = z.object({
  menarche: z
    .number()
    .int()
    .min(8, "Age at menarche must be at least 8 years")
    .max(16, "Age at menarche must be 16 or younger")
    .optional()
    .nullable(),

  lastMenstrualPeriod: z
    .date()
    .optional()
    .nullable(),

  menopauseAge: z
    .number()
    .int()
    .min(40, "Menopause typically occurs between 40-60 years")
    .max(60, "Menopause typically occurs between 40-60 years")
    .optional()
    .nullable(),

  menopauseStatus: z
    .enum(["PRE", "PERI", "POST", "NONE"], {
      errorMap: () => ({ message: "Please select a menopause status" }),
    })
    .optional()
    .nullable(),

  ageAtFirstSexualIntercourse: z
    .number()
    .int()
    .min(12, "Age must be at least 12 years")
    .max(35, "Please enter a realistic age")
    .optional()
    .nullable(),

  isFamilyPlanning: z.boolean().optional().nullable(),

  birthControlMethod: z
    .string()
    .max(100, "Method description must be less than 100 characters")
    .optional()
    .nullable(),

  menstrualPeriodDuration: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 day")
    .max(10, "Duration should typically be 3-7 days")
    .optional()
    .nullable(),

  menstrualCycleInterval: z
    .number()
    .int()
    .min(21, "Cycle interval should be 21-35 days (typical)")
    .max(35, "Cycle interval should be 21-35 days (typical)")
    .optional()
    .nullable(),

  numberOfPadsPerDay: z
    .number()
    .int()
    .min(1, "Minimum 1 pad per day")
    .max(20, "Please enter a realistic number")
    .optional()
    .nullable(),

  gravidity: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(20, "Total pregnancies must be 20 or fewer")
    .optional()
    .nullable(),

  parity: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(20, "Delivered pregnancies must be 20 or fewer")
    .optional()
    .nullable(),

  fullTerm: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),

  premature: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),

  abortion: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),

  livingChildren: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),

  typeOfDelivery: z
    .enum(["VAGINAL", "CESAREAN", "MIXED", "NONE"], {
      errorMap: () => ({ message: "Please select a delivery type" }),
    })
    .optional()
    .nullable(),

  hasPreEclampsia: z
    .boolean()
    .optional()
    .nullable(),
})
  .refine(
    (data) => {
      // If parity is set, it cannot exceed gravidity
      if (data.parity !== null && data.parity !== undefined && data.gravidity !== null && data.gravidity !== undefined && data.parity > data.gravidity) {
        return false
      }
      return true
    },
    {
      message: "Deliveries cannot exceed total pregnancies",
      path: ["parity"],
    }
  )
  .refine(
    (data) => {
      // fullTerm + premature + abortion should roughly equal gravidity
      // Allow some flexibility for data entry errors
      const sum = (data.fullTerm ?? 0) + (data.premature ?? 0) + (data.abortion ?? 0)
      if (data.gravidity !== null && data.gravidity !== undefined && sum > data.gravidity) {
        return false
      }
      return true
    },
    {
      message: "Sum of full-term, premature, and abortion pregnancies cannot exceed total pregnancies",
      path: ["fullTerm"],
    }
  )

export type ObGyneHistoryFormInput = z.infer<typeof obGyneHistorySchema>

/**
 * Helper labels for user-friendly display
 */
export const obGyneHistoryLabels = {
  menopauseStatus: {
    PRE: "Pre-menopause (still having regular periods)",
    PERI: "Peri-menopause (irregular periods)",
    POST: "Post-menopause (no periods for 12+ months)",
    NONE: "Not applicable",
  },
  typeOfDelivery: {
    NONE: "Not applicable",
    VAGINAL: "Vaginal delivery",
    CESAREAN: "Cesarean section (C-section)",
    MIXED: "Both vaginal and cesarean",
  },
}

/**
 * Helper function to validate OB/Gyn data consistency
 */
export const validateObGyneConsistency = (data: ObGyneHistoryFormInput): string[] => {
  const errors: string[] = []

  if (data.gravidity !== null && data.gravidity !== undefined && data.parity !== null && data.parity !== undefined && data.parity > data.gravidity) {
    errors.push("Deliveries cannot exceed total pregnancies")
  }

  const deliverySum = (data.fullTerm ?? 0) + (data.premature ?? 0) + (data.abortion ?? 0)
  if (data.gravidity !== null && data.gravidity !== undefined && deliverySum > data.gravidity) {
    errors.push("Sum of delivery types exceeds total pregnancies")
  }

  if (data.livingChildren !== null && data.livingChildren !== undefined && data.parity !== null && data.parity !== undefined && data.livingChildren > data.parity) {
    errors.push("Living children cannot exceed total deliveries")
  }

  return errors
}
