'use server'

import prisma from '@/lib/prisma'

/**
 * Get database user ID from Clerk user ID
 * @server-only This function uses Prisma and must only run on the server
 */
export async function getDatabaseUserId(clerkUserId: string): Promise<number | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { userId: clerkUserId },
            select: { id: true }
        })
        return user?.id ?? null
    } catch (error) {
        console.error('Error fetching database user ID:', error)
        return null
    }
}
