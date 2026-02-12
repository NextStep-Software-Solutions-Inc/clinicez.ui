import { Gender } from "@prisma/client";
import { startOfToday } from "date-fns";
import { z } from "zod";

/**
 * Post-signup onboarding: Basic Information only.
 * Collects the essential fields not provided by Clerk signup.
 */
export const onboardingBasicInfoSchema = z.object({
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
  mobile: z
    .string({ required_error: "Phone number is required." })
    .min(10, { message: "Phone number must be at least 10 characters." })
    .max(15, { message: "Phone number must not be longer than 15 characters." }),
});

export type OnboardingBasicInfoValues = z.infer<typeof onboardingBasicInfoSchema>;
