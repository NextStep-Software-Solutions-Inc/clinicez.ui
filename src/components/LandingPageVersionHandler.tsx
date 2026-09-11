"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface LandingPageContentProps {
  authenticated: boolean
  onboardingStatus?: string | null
  isPostSignIn?: boolean
}

export default function LandingPageContent({ authenticated, onboardingStatus, isPostSignIn }: LandingPageContentProps) {
  const router = useRouter()

  useEffect(() => {
    if (isPostSignIn && authenticated) {
      const isIncomplete =
        !onboardingStatus || onboardingStatus === "NOT_STARTED" || onboardingStatus === "IN_PROGRESS"
      if (isIncomplete) {
        router.replace("/onboarding")
      } else {
        router.replace("/v2/select-dashboard")
      }
    } else if (!isPostSignIn) {
      router.replace("/v2")
    }
  }, [authenticated, isPostSignIn, onboardingStatus, router])

  // Always redirect to v2, render nothing to avoid flash
  return null
}
