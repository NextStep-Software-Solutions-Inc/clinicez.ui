"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLandingPageVersion } from "./VersionSwitcher"
import FeatureItems, { HeroImage, HeroTitle } from "@components/FeatureItems"
import HeroBackground from "@components/HeroBackground"

interface LandingPageContentProps {
  authenticated: boolean
  onboardingStatus?: string | null
  isPostSignIn?: boolean
}

export default function LandingPageContent({ authenticated, onboardingStatus, isPostSignIn }: LandingPageContentProps) {
  const version = useLandingPageVersion()
  const router = useRouter()

  useEffect(() => {
    if (version !== "v2") return

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
  }, [authenticated, isPostSignIn, version, onboardingStatus, router])

  // While redirecting v2 users, render nothing to avoid a flash
  if (version === "v2") return null

  return (
    <main className="flex flex-col">
      <section className="flex-1 lg:bg-gradient-to-l from-[#6DEBF4] via-[#C3FBFF] to-[#D3FCFF] bg-opacity-30 ">
        <div className="relative container mx-auto p-4 py-56">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center grid-cols-1 gap-2 lg:grid-cols-2 ">
              <HeroTitle authenticated={authenticated} />
              <HeroImage />
            </div>
          </div>
        </div>
      </section>
      <section className="overflow-hidden">
        <FeatureItems />
      </section>
    </main>
  )
}
