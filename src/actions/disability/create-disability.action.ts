'use server'

import prisma from '@/lib/prisma'

/**
 * Create a new disability in the database
 * Returns the created disability with ID
 */
export const createDisabilityAction = async (disabilityName: string) => {
    try {
        const trimmedName = disabilityName.trim()

        if (!trimmedName) {
            return {
                success: false,
                error: 'Disability name is required',
                data: null,
            }
        }

        // Check if disability already exists (case-insensitive)
        const existingDisability = await prisma.disability.findFirst({
            where: {
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        })

        if (existingDisability) {
            return {
                success: true,
                data: existingDisability,
                message: 'Disability already exists',
            }
        }

        // Create new disability
        const newDisability = await prisma.disability.create({
            data: {
                name: trimmedName,
            },
        })

        return {
            success: true,
            data: newDisability,
            message: 'Disability created successfully',
        }
    } catch (error) {
        console.error('[DISABILITY_CREATE_ERROR]', error)
        return {
            success: false,
            error: 'Failed to create disability',
            data: null,
        }
    }
}
