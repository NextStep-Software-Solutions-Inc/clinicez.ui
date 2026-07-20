import { z } from 'zod'

export const studentRecordSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  lrn: z.string().optional().nullable(),
  levelId: z.string().min(1, 'School level is required'),
  yearLevelId: z.string().min(1, 'Year level is required'),
  programId: z.string().min(1, 'Program is required'),
  isCollege: z.boolean().default(false),
  collegeId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
})

export type StudentRecordFormInput = z.infer<typeof studentRecordSchema>
