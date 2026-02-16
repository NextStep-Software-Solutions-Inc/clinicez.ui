import { z } from "zod"

/**
 * Personal History Schema
 * Lifestyle and social history including smoking, alcohol, drug use
 * User-centric: non-judgmental language, optional numeric details
 */

const SMOKING_STATUS = ["NEVER", "FORMER", "CURRENT"] as const
const ALCOHOL_STATUS = ["NEVER", "OCCASIONAL", "REGULAR", "HEAVY"] as const
const DRUG_STATUS = ["NEVER", "FORMER", "CURRENT"] as const
const SEXUALLY_ACTIVE = ["YES", "NO", "INACTIVE"] as const

export const personalHistorySchema = z
  .object({
    smokingStatus: z
      .enum(SMOKING_STATUS, {
        errorMap: () => ({ message: "Please select a smoking status" }),
      })
      .optional()
      .nullable(),

    numberOfPacksPerYear: z
      .number()
      .int()
      .min(0, "Cannot be negative")
      .max(100, "Must be less than 100 packs per year")
      .optional()
      .nullable(),

    alcoholStatus: z
      .enum(ALCOHOL_STATUS, {
        errorMap: () => ({ message: "Please select an alcohol consumption status" }),
      })
      .optional()
      .nullable(),

    numberOfBottlesPerDay: z
      .number()
      .min(0, "Cannot be negative")
      .max(10, "Must be less than 10 bottles per day")
      .optional()
      .nullable(),

    illicitDrugUse: z
      .enum(DRUG_STATUS, {
        errorMap: () => ({ message: "Please select a drug use status" }),
      })
      .optional()
      .nullable(),

    sexuallyActive: z
      .enum(SEXUALLY_ACTIVE, {
        errorMap: () => ({ message: "Please select a status" }),
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Only allow pack count if smoking is current or former
      if (data.numberOfPacksPerYear !== null && data.numberOfPacksPerYear !== undefined) {
        return data.smokingStatus === "CURRENT" || data.smokingStatus === "FORMER"
      }
      return true
    },
    {
      message: "Pack count should only be specified for current or former smokers",
      path: ["numberOfPacksPerYear"],
    }
  )
  .refine(
    (data) => {
      // Only allow bottle count if alcohol use is not "NEVER"
      if (data.numberOfBottlesPerDay !== null && data.numberOfBottlesPerDay !== undefined) {
        return data.alcoholStatus !== "NEVER"
      }
      return true
    },
    {
      message: "Bottle count should only be specified for those who consume alcohol",
      path: ["numberOfBottlesPerDay"],
    }
  )

export type PersonalHistoryFormInput = z.infer<typeof personalHistorySchema>

/**
 * Helper labels for user-friendly display
 */
export const personalHistoryLabels = {
  smokingStatus: {
    NEVER: "Never smoked",
    FORMER: "Former smoker",
    CURRENT: "Currently smoking",
  },
  alcoholStatus: {
    NEVER: "Never drink alcohol",
    OCCASIONAL: "Occasional (a few times per year)",
    REGULAR: "Regular (weekly)",
    HEAVY: "Heavy use (daily or near-daily)",
  },
  illicitDrugUse: {
    NEVER: "Never used",
    FORMER: "Former use",
    CURRENT: "Currently using",
  },
  sexuallyActive: {
    YES: "Yes, currently active",
    NO: "No, not active",
    INACTIVE: "Prefer not to answer",
  },
}
