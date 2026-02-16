import { z } from "zod"

/**
 * Physical Examination Schema
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

  status: z
    .string()
    .max(200, "Status must be less than 200 characters")
    .optional()
    .nullable(),
})

export type PhysicalExaminationFormInput = z.infer<typeof physicalExaminationSchema>
