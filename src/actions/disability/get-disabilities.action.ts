'use server'

import prisma from '@/lib/prisma'
import { cache } from 'react'

export type GetDisabilitiesResult = Awaited<ReturnType<typeof getDisabilitiesAction>>

/**
 * Fetch all active disabilities, ordered by most recently used
 */
export const getDisabilitiesAction = cache(async () => {
    try {
        const disabilities = await prisma.disability.findMany({
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
            take: 100, // Limit to 100 most recent disabilities
        })

        return {
            success: true,
            data: disabilities,
        }
    } catch (error) {
        console.error('[DISABILITY_FETCH_ERROR]', error)
        return {
            success: false,
            error: 'Failed to load disabilities',
            data: [],
        }
    }
})
