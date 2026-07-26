import { z } from 'zod';
import { unmaskDigits } from './mask-utils';

export const philHealthSchema = z.object({
  pin: z
    .string()
    .transform((val) => unmaskDigits(val))
    .refine((val) => val.length === 0 || val.length === 12, {
      message: 'PhilHealth PIN must be exactly 12 digits (e.g. 12-345678901-2)',
    }),
  tin: z
    .string()
    .transform((val) => unmaskDigits(val))
    .refine((val) => val.length === 0 || val.length === 9 || val.length === 12, {
      message: 'TIN must be 9 or 12 digits',
    }),
  philSysId: z
    .string()
    .transform((val) => unmaskDigits(val))
    .refine((val) => val.length === 0 || val.length === 16, {
      message: 'PhilSys ID must be exactly 16 digits (e.g. 1234-5678-9012-3456)',
    }),
  memberType: z.string().optional().nullable(),
});

export const dependentSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last Name is required'),
  relationship: z.string().optional(),
  gender: z.string().optional(),
  dob: z.union([z.string(), z.date()]).optional().nullable(),
});

export type PhilHealthSchemaInput = z.infer<typeof philHealthSchema>;
export type DependentSchemaInput = z.infer<typeof dependentSchema>;
