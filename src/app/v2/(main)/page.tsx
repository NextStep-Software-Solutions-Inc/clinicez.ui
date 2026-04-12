"use client"

import { useEffect } from "react"
import { setLandingPageVersion } from "@/components/VersionSwitcher"
import FeatureItems, { HeroTitle } from "@components/FeatureItems"
import HeroBackground from "@components/HeroBackground"

export default function HomePageV2() {
  useEffect(() => {
    setLandingPageVersion("v2")
  }, [])

  return (
    <main>
      <section className="relative h-[calc(100vh-8rem)] flex items-center justify-center">
        <HeroBackground opacity={0.2} />
        <div className="relative z-10 container mx-auto">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center justify-center text-center">
              <HeroTitle version="v2" />
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