"use client"

import { useState, useEffect } from "react"

const LANDING_VERSION_KEY = "landing-page-version"

export function useLandingPageVersion() {
  const [version, setVersion] = useState<"v1" | "v2">("v1")

  useEffect(() => {
    const savedVersion = localStorage.getItem(LANDING_VERSION_KEY) as "v1" | "v2" | null
    if (savedVersion === "v2") {
      setVersion("v2")
    }
  }, [])

  return version
}

export function setLandingPageVersion(version: "v1" | "v2") {
  localStorage.setItem(LANDING_VERSION_KEY, version)
}

export function getLandingPageVersion(): "v1" | "v2" {
  if (typeof window === "undefined") return "v1"
  const savedVersion = localStorage.getItem(LANDING_VERSION_KEY) as "v1" | "v2" | null
  return savedVersion || "v1"
}
