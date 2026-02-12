import { BloodType, CivilStatus, Gender } from "@prisma/client";
import { startOfToday } from "date-fns";
import { z } from "zod";

/**
 * Step 1: Basic Information (Required)
 */
export const onboardingStep1Schema = z.object({
  firstName: z
    .string({ required_error: "First name is required." })
    .refine((v) => v.trim().length > 0, {
      message: "First name must not be empty.",
    }),
  lastName: z
    .string({ required_error: "Last name is required." })
    .refine((v) => v.trim().length > 0, {
      message: "Last name must not be empty.",
    }),
  dob: z
    .date({ required_error: "Date of birth is required." })
    .refine((date) => date <= startOfToday(), {
      message: "Date of birth cannot be in the future.",
    }),
  gender: z.nativeEnum(Gender, {
    required_error: "Please select your gender at birth.",
  }),
});

export type OnboardingStep1Values = z.infer<typeof onboardingStep1Schema>;

/**
 * Step 2: Contact Information (Required)
 */
export const onboardingStep2Schema = z.object({
  mobile: z
    .string({ required_error: "Phone number is required." })
    .min(10, { message: "Phone number must be at least 10 characters." })
    .max(15, { message: "Phone number must not be longer than 15 characters." }),
  email: z
    .string({ required_error: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
});

export type OnboardingStep2Values = z.infer<typeof onboardingStep2Schema>;

/**
 * Step 3: Additional Information (Optional fields)
 */
export const onboardingStep3Schema = z.object({
  middleName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  civilStatus: z.nativeEnum(CivilStatus).optional().nullable(),
  bloodType: z.nativeEnum(BloodType).optional().nullable(),
  telephone: z
    .string()
    .max(30, {
      message: "Telephone number must not be longer than 30 characters.",
    })
    .optional()
    .nullable(),
  religion: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
});

export type OnboardingStep3Values = z.infer<typeof onboardingStep3Schema>;

/** Combined schema for full validation */
export const onboardingFullSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema);

export type OnboardingFullValues = z.infer<typeof onboardingFullSchema>;

/** Step labels for the stepper UI */
export const ONBOARDING_STEPS = [
  { name: "basic-info", label: "Basic Info" },
  { name: "contact", label: "Contact" },
  { name: "additional", label: "Additional" },
  { name: "review", label: "Review" },
] as const;

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number]["name"];
