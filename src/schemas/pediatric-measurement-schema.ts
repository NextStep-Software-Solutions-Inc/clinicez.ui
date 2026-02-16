import { z } from "zod"

/**
 * Pediatric Measurement Schema
 * Growth and development measurements for pediatric patients
 * User-centric: helpful ranges and validation
 */

export const pediatricMeasurementSchema = z.object({
  dateTaken: z
    .date()
    .max(new Date(), "Measurement date must be today or earlier"),
  
  length: z
    .number()
    .min(20, "Length must be at least 20 cm")
    .max(150, "Length must be less than 150 cm")
    .optional()
    .nullable(),
  
  headCircumference: z
    .number()
    .min(20, "Head circumference must be at least 20 cm")
    .max(60, "Head circumference must be less than 60 cm")
    .optional()
    .nullable(),
  
  skinfoldThickness: z
    .number()
    .min(0, "Skinfold thickness cannot be negative")
    .max(40, "Skinfold thickness must be less than 40 mm")
    .optional()
    .nullable(),
  
  waistCircumference: z
    .number()
    .min(10, "Waist circumference must be at least 10 cm")
    .max(150, "Waist circumference must be less than 150 cm")
    .optional()
    .nullable(),
  
  hipCircumference: z
    .number()
    .min(10, "Hip circumference must be at least 10 cm")
    .max(150, "Hip circumference must be less than 150 cm")
    .optional()
    .nullable(),
  
  limbCircumference: z
    .number()
    .min(5, "Limb circumference must be at least 5 cm")
    .max(40, "Limb circumference must be less than 40 cm")
    .optional()
    .nullable(),
  
  midUpperArmCircumference: z
    .number()
    .min(10, "MUAC must be at least 10 cm (typically 12-20 cm for children)")
    .max(50, "MUAC must be less than 50 cm")
    .optional()
    .nullable(),
  
  remarks: z
    .string()
    .max(500, "Remarks must be less than 500 characters")
    .optional()
    .nullable(),
})

export type PediatricMeasurementFormInput = z.infer<typeof pediatricMeasurementSchema>

/**
 * Helper function to evaluate MUAC (Mid-Upper Arm Circumference)
 * User-centric: provides nutritional status interpretation
 */
export const evaluateMUAC = (muac: number | null | undefined): string | null => {
  if (!muac) return null

  if (muac < 11.5) return "Severe acute malnutrition"
  if (muac < 12.5) return "Moderate acute malnutrition"
  if (muac < 13.5) return "Mild malnutrition"
  return "Normal nutritional status"
}

/**
 * Field groups for better form organization
 */
export const pediatricMeasurementFieldGroups = {
  linear: {
    label: "Linear Measurements",
    fields: ["length", "headCircumference"],
  },
  circumferences: {
    label: "Body Circumferences",
    fields: ["waistCircumference", "hipCircumference", "midUpperArmCircumference", "limbCircumference"],
  },
  tissue: {
    label: "Tissue Measurements",
    fields: ["skinfoldThickness"],
  },
  notes: {
    label: "Additional Notes",
    fields: ["remarks"],
  },
}
