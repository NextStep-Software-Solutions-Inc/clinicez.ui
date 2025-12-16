"use client"

import { useState, useEffect } from "react"

const LANDING_VERSION_KEY = "landing-page-version"

type Version = "v1" | "v2"

// Initialize global version from localStorage once
function getInitialVersion(): Version {
  if (typeof window !== "undefined") {
    const savedVersion = localStorage.getItem(LANDING_VERSION_KEY)
    if (savedVersion === "v1" || savedVersion === "v2") {
      return savedVersion
    }
  }
  return "v1"
}

// Global state to sync across components
let globalVersion: Version = getInitialVersion()
const listeners: Set<(version: Version) => void> = new Set()

function notifyListeners(version: Version) {
  globalVersion = version
  listeners.forEach(listener => listener(version))
}

export function useLandingPageVersion() {
  const [version, setVersion] = useState<Version>(globalVersion)

  useEffect(() => {
    const listener = (newVersion: Version) => setVersion(newVersion)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return version
}

export function setLandingPageVersion(version: Version) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANDING_VERSION_KEY, version)
    notifyListeners(version)
  }
}

export function getLandingPageVersion(): Version {
  return getInitialVersion()
}
