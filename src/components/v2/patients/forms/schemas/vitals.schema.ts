import { z } from 'zod';

export const vitalsSchema = z.object({
  systolic: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 40 && Number(val) <= 250), {
      message: 'Systolic BP must be between 40 and 250 mmHg',
    }),
  diastolic: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 30 && Number(val) <= 150), {
      message: 'Diastolic BP must be between 30 and 150 mmHg',
    }),
  hr: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 30 && Number(val) <= 220), {
      message: 'Heart Rate must be between 30 and 220 bpm',
    }),
  rr: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 8 && Number(val) <= 60), {
      message: 'Respiration Rate must be between 8 and 60 bpm',
    }),
  temp: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 30 && Number(val) <= 45), {
      message: 'Temperature must be between 30°C and 45°C',
    }),
  height: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 20 && Number(val) <= 250), {
      message: 'Height must be between 20 and 250 cm',
    }),
  weight: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (Number(val) >= 1 && Number(val) <= 350), {
      message: 'Weight must be between 1 and 350 kg',
    }),
});

export type VitalsSchemaInput = z.infer<typeof vitalsSchema>;
