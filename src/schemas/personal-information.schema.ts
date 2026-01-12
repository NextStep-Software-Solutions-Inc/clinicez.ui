import { BloodType, CivilStatus, Gender } from "@prisma/client";
import { startOfToday } from "date-fns"
import { z } from "zod"

export const personalInformationFormSchema = z.object({
  firstName: z.string({
    required_error: "First name is required.",
  }).refine(value => value.trim().length > 0, {
    message: "First name must not be empty.",
  }),
  middleName: z.string({
    message: "What your mother's maiden name."
  }).optional().nullable(),
  lastName: z.string({
    required_error: "Last name is required.",
  }).refine(value => value.trim().length > 0, {
    message: "Last name must not be empty.",
  }),
  suffix: z.string({
    message: "What suffix do you have?"
  }).optional().nullable(),
  nickname: z.string({
    message: "You don't have a nickname?"
  }).refine(value => value.trim().length > 0, {
    message: "How do you want to be called?"
  }),
  religion: z.string({
    required_error: "You don't have a religion?, Please put 'None' if you don't have any."
  }).refine(value => value.trim().length > 0, {
    message: "You forgot to put your religion. Please put 'None' if you don't have any."
  }),
  nationality: z.string({
    message: "You don't have a nationality?"
  }).refine(value => value.trim().length > 0, {
    message: "You forgot to put your nationality or citizenship."
  }),
  telephone: z.string().max(30, {
    message: "Telephone number must not be longer than 30 characters.",
  }).nullable().optional(),
  mobile: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }).max(15, {
    message: "Phone number must not be longer than 15 characters.",
  }),
  gender: z.nativeEnum(Gender, {
    required_error: "Please select your gender at birth."
  }),
  bloodType: z.nativeEnum(BloodType, {
    required_error: "Please select your blood type. If you don't know your blood type, select 'Unknown'."
  }),
  civilStatus: z.nativeEnum(CivilStatus, {
    required_error: "Please select your civil status."
  }),
  dob: z.date({
    required_error: "A date of birth is required.",
  }).refine(date => date <= startOfToday(), {
    message: "Date of birth cannot be in the future.",
  }),
  placeOfBirth: z.string({
    message: "Where were you born?"
  }).optional()
    .transform((e) => e === "" ? undefined : e),
})

export type PersonalInformationFormValues = z.infer<typeof personalInformationFormSchema>