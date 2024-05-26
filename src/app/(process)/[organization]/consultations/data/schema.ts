import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const consultationRecordSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
  appointmentId: z.string(),
})

export type ConsultationRecordSchema = z.infer<typeof consultationRecordSchema>
