import { z } from "zod"

/**
 * Address Schema - User Address Information
 * Validates address data for creation and updates
 */

export const addressSchema = z.object({
    id: z.number().optional(),
    address: z
        .string()
        .min(1, "Complete address is required")
        .max(500, "Address must be less than 500 characters"),

    apartmentUnit: z
        .string()
        .max(50, "Apartment/Unit must be less than 50 characters")
        .optional()
        .nullable(),

    bldgName: z
        .string()
        .max(100, "Building name must be less than 100 characters")
        .optional()
        .nullable(),

    addressLine: z
        .string()
        .max(200, "Address line must be less than 200 characters")
        .optional()
        .nullable(),

    street: z
        .string()
        .max(100, "Street must be less than 100 characters")
        .optional()
        .nullable(),

    subdivision: z
        .string()
        .max(100, "Subdivision must be less than 100 characters")
        .optional()
        .nullable(),

    region: z
        .string()
        .max(100, "Region must be less than 100 characters")
        .optional()
        .nullable(),

    barangay: z
        .string()
        .max(100, "Barangay must be less than 100 characters")
        .optional()
        .nullable(),

    city: z
        .string()
        .max(100, "City must be less than 100 characters")
        .optional()
        .nullable(),

    state: z
        .string()
        .max(100, "State/Province must be less than 100 characters")
        .optional()
        .nullable(),

    zipCode: z
        .string()
        .max(20, "ZIP/Postal code must be less than 20 characters")
        .optional()
        .nullable(),

    country: z
        .string()
        .min(1, "Country is required")
        .max(100, "Country must be less than 100 characters"),

    isPrimary: z.boolean().default(false),
})

export type AddressFormInput = z.infer<typeof addressSchema>

/**
 * Array schema for multiple addresses
 */
export const addressesListSchema = z.array(addressSchema)

export type AddressesList = z.infer<typeof addressesListSchema>
