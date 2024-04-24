import { UserProfile } from "@auth0/nextjs-auth0/client"

export const isTenantOwner = (user: UserProfile) => (user["clinic-ez/roles"] as [string])?.includes("tenant-owner")
export const isHP = (user: UserProfile) => (user["clinic-ez/roles"] as [string])?.some(role => role.startsWith("hp-"))