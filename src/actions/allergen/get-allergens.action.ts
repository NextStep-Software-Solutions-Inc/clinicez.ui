'use server'

import prisma from '@/lib/prisma'
import { cache } from 'react'

export type GetAllergensResult = Awaited<ReturnType<typeof getAllergensAction>>

/**
 * Fetch all active allergens, ordered by most recently used
 */
export const getAllergensAction = cache(async () => {
    try {
        const allergens = await prisma.allergen.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 100, // Limit to 100 most recent allergens
        })

        return {
            success: true,
            data: allergens,
        }
    } catch (error) {
        console.error('[ALLERGEN_FETCH_ERROR]', error)
        return {
            success: false,
            error: 'Failed to load allergens',
            data: [],
        }
    }
})
