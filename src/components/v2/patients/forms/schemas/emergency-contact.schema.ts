import { z } from 'zod';
import { unmaskDigits } from './mask-utils';

export const emergencyContactSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => unmaskDigits(val))
    .refine((val) => val.length === 11, {
      message: 'Mobile number must be 11 digits (e.g. 0917-123-4567)',
    }),
  address: z.string().optional().nullable(),
});

export type EmergencyContactSchemaInput = z.infer<typeof emergencyContactSchema>;
