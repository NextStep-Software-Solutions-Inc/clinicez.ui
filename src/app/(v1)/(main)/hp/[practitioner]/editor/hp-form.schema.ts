import { z } from "zod";

export const profileSchema = z.object({
  id: z.number().optional(),
  picture: z.string().optional(),
  cover: z.string().optional(),
  eSignatureUrl: z.string().optional(),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  suffix: z.string().optional(),
  workEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  workPhone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  // Professional Information
  philosophy: z.string().trim().min(2, {
    message: "Bio must be at least 2 characters.",
  }),
  areaOfInterest: z.string().trim().min(2, {
    message: "Bio must be at least 2 characters.",
  }),
  experience: z.string().trim().min(2, {
    message: "Experience must be at least 2 characters.",
  }),
  hobbies: z.string().trim(),
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
})

export type HPProfileType = z.infer<typeof profileSchema>;

export const professionalDetailsSchema = z.object({
  id: z.number().optional(),
  licenseNumber: z.string().min(2, {
    message: "License number must be at least 2 characters.",
  }),
  licenseIssued: z.date(),
  licenseExpires: z.date(),
  ptrNumber: z.string().min(2, {
    message: "PTR number must be at least 2 characters.",
  }),
  taxNumber: z.string().min(2, {
    message: "Tax number must be at least 2 characters.",
  }),
}).refine((data) => {
  if (data.licenseIssued && data.licenseExpires) {
    return data.licenseExpires > data.licenseIssued;
  }
  return true;
}, {
  message: "License expiry date must be after the license issued date.",
  path: ["licenseExpires"],
})

export type ProfessionalDetailsFormType = z.infer<typeof professionalDetailsSchema>;