"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { setLandingPageVersion } from "@/components/VersionSwitcher"

export default function HomePageV2() {
  const router = useRouter()

  useEffect(() => {
    // Set v2 preference before redirecting to preserve user intent
    setLandingPageVersion("v2")
    router.replace("/")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}