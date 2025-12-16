"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setLandingPageVersion } from "@/components/VersionSwitcher"

export default function HomePageV2() {
  const router = useRouter()

  useEffect(() => {
    // Set v2 preference before redirecting to preserve user intent
    setLandingPageVersion("v2")
    router.replace("/")
    // Note: router is intentionally omitted from deps as it's stable in Next.js
  }, [])

  return null
}