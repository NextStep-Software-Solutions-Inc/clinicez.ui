import { Pi } from "lucide-react"
import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const membershipRequestSchema = z.object({
  id: z.number(),
  role: z.object({
    id: z.number(),
    name: z.string(),
  }),
  status: z.string(),
  createdAt: z.date(),
  User: z.object({
    id: z.number(),
    picture: z.string().nullable(),
    userId: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    gender: z.string().optional().nullable(),
    dob: z.date().optional().nullable(),
  }),
  AcceptedBy: z.object({
    id: z.number(),
    userId: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  }).nullable(),
})

export type MembershipRequestSchema = z.infer<typeof membershipRequestSchema>
