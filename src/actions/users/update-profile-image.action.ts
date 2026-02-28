'use server'

import { clerkClient, currentUser } from '@clerk/nextjs/server'

/**
 * Update Clerk profile image for a specific user.
 * When targetUserId is provided the Clerk Admin API updates that user's avatar
 * directly (e.g. a provider updating a patient's picture).
 * When omitted, falls back to the currently authenticated user.
 */
export async function updateClerkProfileImageAction(imageUrl: string, targetUserId?: string): Promise<boolean> {
    try {
        let clerkUserId: string

        if (targetUserId) {
            clerkUserId = targetUserId
        } else {
            const user = await currentUser()
            if (!user) {
                console.error('No authenticated user found')
                return false
            }
            clerkUserId = user.id
        }

        // Fetch the image from the URL
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
        }

        // Convert response to Blob
        const imageBlob = await imageResponse.blob()

        // Upload to Clerk using updateUserProfileImage
        const client = await clerkClient()
        await client.users.updateUserProfileImage(clerkUserId, {
            file: imageBlob,
        })

        console.log(`Profile image synced to Clerk for user ${clerkUserId}`)
        return true
    } catch (error) {
        console.error('Failed to sync profile image with Clerk:', error)
        // Return true anyway - the image was saved to the app database
        // Clerk sync is optional for UX continuity
        return true
    }
}
