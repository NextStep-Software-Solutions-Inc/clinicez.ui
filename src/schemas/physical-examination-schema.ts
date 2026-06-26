import { z } from "zod"

/**
 * Visual Acuity Schema
 * Validates visual acuity fields on VitalSign
 */

export const physicalExaminationSchema = z.object({
  id: z.string().optional(),
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
  generalSurveyId: z.string().optional().nullable(),
  generalSurveyRemarks: z.string().optional().nullable(),
  heentId: z.string().optional().nullable(),
  heentRemarks: z.string().optional().nullable(),
  chestId: z.string().optional().nullable(),
  chestRemarks: z.string().optional().nullable(),
  heartId: z.string().optional().nullable(),
  heartRemarks: z.string().optional().nullable(),
  abdomenId: z.string().optional().nullable(),
  abdomenRemarks: z.string().optional().nullable(),
  guId: z.string().optional().nullable(),
  guRemarks: z.string().optional().nullable(),
  skinId: z.string().optional().nullable(),
  skinRemarks: z.string().optional().nullable(),
  neuroId: z.string().optional().nullable(),
  neuroRemarks: z.string().optional().nullable(),
  rectalId: z.string().optional().nullable(),
  rectalRemarks: z.string().optional().nullable(),
})

export type PhysicalExaminationFormInput = z.infer<typeof physicalExaminationSchema>

