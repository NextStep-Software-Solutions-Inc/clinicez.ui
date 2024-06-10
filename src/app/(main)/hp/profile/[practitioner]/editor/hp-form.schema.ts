import { z } from "zod";

export const profileSchema = z.object({
  id: z.number().optional(),
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
  // dob: z.date(),
  // Address
  // address1: z.string().min(2, {
  //   message: "Address must be at least 2 characters.",
  // }),
  // address2: z.string().optional(),
  // city: z.string().min(2, {
  //   message: "City must be at least 2 characters.",
  // }),
  // state: z.string().min(2, {
  //   message: "State must be at least 2 characters.",
  // }),
  // zip: z.string().min(4, {
  //   message: "Zip code must be at least 5 characters.",
  // }),
  // country: z.string().min(2, {
  //   message: "Country must be at least 2 characters.",
  // }),
    
  // Professional Information
  philosophy: z.string().min(2, {
    message: "Bio must be at least 2 characters.",
  }),
  areaOfInterest: z.string().min(2, {
    message: "Bio must be at least 2 characters.",
  }),
  experience: z.string().min(2, {
    message: "Experience must be at least 2 characters.",
  }),
  languages: z.array(z.object({
    name: z.string().min(2, {
      message: "Language must be at least 2 characters.",
    })
  })),
  specialties: z.array(z.object({
    name: z.string().min(2, {
      message: "Specialty must be at least 2 characters.",
    })
  })),
  education: z.array(z.object({
    name:z.string().min(2, {
      message: "Education must be at least 2 characters.",
    })
  })),
  certifications: z.array(z.object({
    name:z.string().min(2, {
      message: "Certifications must be at least 2 characters.",
    })
  })),
  fields: z.array(z.object({
    name:z.string().min(2, {
      message: "Field of practice must be at least 2 characters.",
    })
  })),
  affiliations: z.array(z.object({
    name:z.string().min(2, {
      message: "Affiliation must be at least 2 characters.",
    })
  })),
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
})

export type ProfessionalDetailsFormType = z.infer<typeof professionalDetailsSchema>;