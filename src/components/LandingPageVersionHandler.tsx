"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLandingPageVersion } from "./VersionSwitcher"
import FeatureItems, { HeroImage, HeroTitle } from "@components/FeatureItems"
import HeroBackground from "@components/HeroBackground"

interface LandingPageContentProps {
  authenticated: boolean
  onboardingStatus?: string | null
}

export default function LandingPageContent({ authenticated, onboardingStatus }: LandingPageContentProps) {
  const version = useLandingPageVersion()
  const router = useRouter()

  useEffect(() => {
    if (!authenticated || version !== "v2") return

    const isIncomplete =
      onboardingStatus === "NOT_STARTED" || onboardingStatus === "IN_PROGRESS"
    if (isIncomplete) {
      router.replace("/onboarding")
    } else {
      router.replace("/v2/select-dashboard")
    }
  }, [authenticated, version, onboardingStatus, router])

  // While redirecting authenticated v2 users, render nothing to avoid a flash
  if (authenticated && version === "v2") return null

  if (version === "v2") {
    return (
      <main>
        {/* Hero Section */}
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
