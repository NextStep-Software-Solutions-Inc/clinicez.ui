import { z } from 'zod'

export const employeeRecordSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  position: z.string().min(1, 'Position is required'),
  designation: z.string().optional().nullable(),
  officeId: z.string().min(1, 'Office is required'),
  departmentId: z.string().optional().nullable(),
  collegeId: z.string().optional().nullable(),
  isCollege: z.boolean().default(false),
})

export type EmployeeRecordFormInput = z.infer<typeof employeeRecordSchema>
