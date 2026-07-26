import { z } from "zod"

/**
 * Vital Signs Schema
 * User-centric validation with realistic health ranges
 */

export const vitalSignSchema = z
  .object({
    dateTaken: z
      .date()
      .refine((d) => d <= new Date(), "Vital sign date must be today or earlier"),

    height: z
      .number()
      .min(50, "Height must be at least 50 cm (about 1.6 feet)")
      .max(250, "Height must be less than 250 cm (about 8.2 feet)")
      .optional()
      .nullable(),

    weight: z
      .number()
      .min(1, "Weight must be at least 1 kg")
      .max(500, "Weight must be less than 500 kg")
      .optional()
      .nullable(),

    bpSystolic: z
      .number()
      .int()
      .min(40, "Systolic BP must be at least 40 mmHg")
      .max(250, "Systolic BP must be less than 250 mmHg")
      .optional()
      .nullable(),

    bpDiastolic: z
      .number()
      .int()
      .min(20, "Diastolic BP must be at least 20 mmHg")
      .max(160, "Diastolic BP must be less than 160 mmHg")
      .optional()
      .nullable(),

    pulseRate: z
      .number()
      .int()
      .min(30, "Pulse rate must be at least 30 bpm")
      .max(200, "Pulse rate must be less than 200 bpm (typical range is 60-100 bpm)")
      .optional()
      .nullable(),

    temp: z
      .number()
      .min(35, "Temperature must be at least 35°C")
      .max(43, "Temperature must be less than 43°C (typical range is 36.5-37.5°C)")
      .optional()
      .nullable(),

    spo2: z
      .number()
      .min(80, "Oxygen saturation must be at least 80%")
      .max(100, "Oxygen saturation cannot exceed 100%")
      .optional()
      .nullable(),

    respRate: z
      .number()
      .int()
      .min(8, "Respiration rate must be at least 8 breaths/min")
      .max(40, "Respiration rate must be less than 40 breaths/min (typical range is 12-20)")
      .optional()
      .nullable(),

    notes: z
      .string()
      .max(500, "Notes must be less than 500 characters")
      .optional()
      .nullable(),

    // Vision
    visualAcuityLeft: z.string().max(20).optional().nullable(),
    visualAcuityRight: z.string().max(20).optional().nullable(),

    // Anthropometrics
    length: z.number().min(0).max(200).optional().nullable(),
    headCircumference: z.number().min(0).max(100).optional().nullable(),
    skinfoldThickness: z.number().min(0).max(100).optional().nullable(),
    waistCircumference: z.number().min(0).max(200).optional().nullable(),
    hipCircumference: z.number().min(0).max(200).optional().nullable(),
    limbCircumference: z.number().min(0).max(100).optional().nullable(),
    midUpperArmCircumference: z.number().min(0).max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      // If both BP values provided, validate relationship
      if (data.bpSystolic && data.bpDiastolic) {
        return data.bpSystolic > data.bpDiastolic
      }
      return true
    },
    {
      message: "Systolic blood pressure must be greater than diastolic",
      path: ["bpDiastolic"],
    }
  )
  .refine(
    (data) => {
      // Realistic BP relationship: systolic should be roughly 30-40 more than diastolic
      if (data.bpSystolic && data.bpDiastolic) {
        const diff = data.bpSystolic - data.bpDiastolic
        // Allow some flexibility but warn if unrealistic
        return diff >= 15 && diff <= 50
      }
      return true
    },
    {
      message: "Blood pressure values seem unrealistic (difference between systolic and diastolic should be 15-50 mmHg)",
      path: ["bpDiastolic"],
    }
  )

export type VitalSignFormInput = z.infer<typeof vitalSignSchema>

/**
 * Helper function to calculate BMI
 * User-centric: shows category and guidance
 */
export const calculateBMI = (
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): { bmi: number; category: string } | null => {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null

  const heightM = heightCm / 100
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1))

  let category = "Unknown"
  if (bmi < 18.5) category = "Underweight"
  else if (bmi < 25) category = "Normal weight"
  else if (bmi < 30) category = "Overweight"
  else if (bmi < 35) category = "Class I Obesity"
  else if (bmi < 40) category = "Class II Obesity"
  else category = "Class III Obesity"

  return { bmi, category }
}

/**
 * Helper function to get BP classification
 * User-centric: shows health status
 */
export const getBPClassification = (
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): string => {
  if (!systolic || !diastolic) return "Incomplete data"

  if (systolic < 120 && diastolic < 80) return "Normal"
  if (systolic < 130 && diastolic < 80) return "Elevated"
  if (systolic < 140 || diastolic < 90) return "High Blood Pressure Stage 1"
  if (systolic >= 140 || diastolic >= 90) return "High Blood Pressure Stage 2"
  return "Unknown"
}
