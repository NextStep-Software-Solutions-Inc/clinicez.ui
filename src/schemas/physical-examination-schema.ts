import { z } from "zod"

/**
 * Visual Acuity Schema
 * Validates visual acuity fields on VitalSign
 */

export const physicalExaminationSchema = z.object({
  visualAcuityLeft: z
    .string()
    .regex(/^\d+\/\d+$/, "Vision must be in format like 20/20 or 6/6")
    .optional()
    .nullable(),

  visualAcuityRight: z
    .string()
    .regex(/^\d+\/\d+$/, "Vision must be in format like 20/20 or 6/6")
    .optional()
    .nullable(),
})

export type PhysicalExaminationFormInput = z.infer<typeof physicalExaminationSchema>
