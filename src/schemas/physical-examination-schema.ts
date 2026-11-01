import { z } from "zod";

/**
 * Visual Acuity Schema & Physical Examination Schema
 * Validates physical examination findings per PhilHealth SSVTG rev20260708 (Annex B.4)
 */

const peCodeSchema = z.union([z.string(), z.array(z.string())]).optional().nullable();

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
  heentId: peCodeSchema,
  heentRemarks: z.string().optional().nullable(),
  chestId: peCodeSchema,
  chestRemarks: z.string().optional().nullable(),
  heartId: peCodeSchema,
  heartRemarks: z.string().optional().nullable(),
  abdomenId: peCodeSchema,
  abdomenRemarks: z.string().optional().nullable(),
  guId: peCodeSchema,
  guRemarks: z.string().optional().nullable(),
  skinId: peCodeSchema,
  skinRemarks: z.string().optional().nullable(),
  neuroId: peCodeSchema,
  neuroRemarks: z.string().optional().nullable(),
  rectalId: peCodeSchema,
  rectalRemarks: z.string().optional().nullable(),
});

export type PhysicalExaminationFormInput = z.infer<typeof physicalExaminationSchema>;
