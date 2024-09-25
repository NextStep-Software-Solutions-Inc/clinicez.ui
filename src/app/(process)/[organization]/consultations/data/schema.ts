import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const consultationTicketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
  appointmentId: z.string(),
})

export type ConsultationTicketSchema = z.infer<typeof consultationTicketSchema>
