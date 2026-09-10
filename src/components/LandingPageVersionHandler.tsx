"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import FeatureItems, { HeroTitle } from "@components/FeatureItems"
import HeroBackground from "@components/HeroBackground"

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
    }
  }, [authenticated, isPostSignIn, onboardingStatus, router])

  return (
    <main>
      <section className="relative h-[calc(100vh-8rem)] flex items-center justify-center">
        <HeroBackground opacity={0.2} />
        <div className="relative z-10 container mx-auto">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center justify-center text-center">
              <HeroTitle version="v2" authenticated={authenticated} />
            </div>
          </div>
        </div>
      </section>
      <section className="relative z-20 overflow-hidden">
        <FeatureItems version="v2" />
      </section>
    </main>
  )
}
