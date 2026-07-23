import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  barangay: z.string().optional().nullable(),
  city: z.string().min(1, 'City/Municipality is required'),
  province: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zipCode: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}$/.test(val), {
      message: 'Zip code must be 4 digits',
    }),
});

export type AddressSchemaInput = z.infer<typeof addressSchema>;
