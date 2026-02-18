'use server'

import prisma from '@/lib/prisma'

/**
 * Create a new allergen in the database
 * Returns the created allergen with ID
 */
export const createAllergenAction = async (allergenName: string) => {
    try {
        const trimmedName = allergenName.trim()

        if (!trimmedName) {
            return {
                success: false,
                error: 'Allergen name is required',
                data: null,
            }
        }

        // Check if allergen already exists (case-insensitive)
        const existingAllergen = await prisma.allergen.findFirst({
            where: {
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        })

        if (existingAllergen) {
            return {
                success: true,
                data: existingAllergen,
                message: 'Allergen already exists',
            }
        }

        // Create new allergen
        const newAllergen = await prisma.allergen.create({
            data: {
                name: trimmedName,
            },
        })

        return {
            success: true,
            data: newAllergen,
            message: 'Allergen created successfully',
        }
    } catch (error) {
        console.error('[CREATE_ALLERGEN_ERROR]', error)
        return {
            success: false,
            error: 'Failed to create allergen',
            data: null,
        }
    }
}
