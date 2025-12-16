"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

const LANDING_VERSION_KEY = "landing-page-version"

export function useLandingPageVersion() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect on the root landing page
    if (pathname !== "/" && pathname !== "/v2") return

    const savedVersion = localStorage.getItem(LANDING_VERSION_KEY)
    
    // If user is on v1 (/) but preference is v2, redirect to v2
    if (pathname === "/" && savedVersion === "v2") {
      router.replace("/v2")
    }
    // If user is on v2 but preference is v1 (or not set), redirect to v1
    else if (pathname === "/v2" && (!savedVersion || savedVersion === "v1")) {
      router.replace("/")
    }
  }, [pathname, router])
}

export function setLandingPageVersion(version: "v1" | "v2") {
  localStorage.setItem(LANDING_VERSION_KEY, version)
}
