import { z } from "zod";

export const v2ProfileSchema = z.object({
  id: z.number().optional(),
  picture: z.string().optional(),
  cover: z.string().optional(),
  eSignatureUrl: z.string().optional(),
  title: z.string().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  suffix: z.string().optional(),
  workEmail: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().or(z.literal("")),
  workPhone: z.string().optional(),
  philosophy: z.string().trim().optional(),
  areaOfInterest: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  hobbies: z.string().trim().optional(),
  languages: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Language must be at least 2 characters.",
    })
  })),
  specialties: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Specialty must be at least 2 characters.",
    })
  })),
  educations: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Education must be at least 2 characters.",
    })
  })),
  certifications: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Certifications must be at least 2 characters.",
    })
  })),
  fields: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Field of practice must be at least 2 characters.",
    })
  })),
  affiliations: z.array(z.object({
    name: z.string().trim().min(2, {
      message: "Affiliation must be at least 2 characters.",
    })
  }))
});

export type V2HPProfileType = z.infer<typeof v2ProfileSchema>;
