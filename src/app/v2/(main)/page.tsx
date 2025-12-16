"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePageV2() {
  const router = useRouter()

  useEffect(() => {
    // Set v2 preference before redirecting to preserve user intent
    if (typeof window !== "undefined") {
      localStorage.setItem("landing-page-version", "v2")
    }
    router.replace("/")
  }, [router])

  return null
}