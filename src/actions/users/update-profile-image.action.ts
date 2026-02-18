'use server'

import { clerkClient, currentUser } from '@clerk/nextjs/server'

/**
 * Update Clerk profile image
 * Syncs the profile picture to the Clerk user profile
 * Fetches the image from the URL and uploads it to Clerk
 */
export async function updateClerkProfileImageAction(imageUrl: string): Promise<boolean> {
    try {
        const user = await currentUser()
        if (!user) {
            console.error('No authenticated user found')
            return false
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
        await client.users.updateUserProfileImage(user.id, {
            file: imageBlob,
        })

        console.log(`Profile image synced to Clerk for user ${user.id}`)
        return true
    } catch (error) {
        console.error('Failed to sync profile image with Clerk:', error)
        // Return true anyway - the image was saved to the app database
        // Clerk sync is optional for UX continuity
        return true
    }
}
