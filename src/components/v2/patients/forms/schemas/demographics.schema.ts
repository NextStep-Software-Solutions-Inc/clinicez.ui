import { z } from 'zod';
import { unmaskDigits } from './mask-utils';

export const demographicsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  dob: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine(
      (val) =>
        val !== null &&
        val !== undefined &&
        val !== '' &&
        (val instanceof Date || (typeof val === 'string' && val.trim().length > 0)),
      { message: 'Date of birth is required' }
    ),
  gender: z.string().min(1, 'Gender is required'),
  bloodType: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  mobile: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? unmaskDigits(val) : ''))
    .refine((val) => val.length === 0 || val.length === 11, {
      message: 'Mobile number must be 11 digits (e.g. 0917-123-4567)',
    }),
  mobileNo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? unmaskDigits(val) : ''))
    .refine((val) => val.length === 0 || val.length === 11, {
      message: 'Mobile number must be 11 digits (e.g. 0917-123-4567)',
    }),
  landlineNo: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email address format',
    }),
});

export type DemographicsSchemaInput = z.infer<typeof demographicsSchema>;
