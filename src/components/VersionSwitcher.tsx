"use client"

import { useState, useEffect } from "react"

const LANDING_VERSION_KEY = "landing-page-version"

type Version = "v1" | "v2"

// Get version from localStorage with validation
function getVersionFromStorage(): Version {
  if (typeof window !== "undefined") {
    const savedVersion = localStorage.getItem(LANDING_VERSION_KEY)
    if (savedVersion === "v1" || savedVersion === "v2") {
      return savedVersion
    }
  }
  return "v1"
}

// Global state to sync across components (lazy initialized)
// Safe for browser usage - JavaScript is single-threaded in the browser
let globalVersion: Version | null = null
const listeners: Set<(version: Version) => void> = new Set()

function getGlobalVersion(): Version {
  if (globalVersion === null) {
    globalVersion = getVersionFromStorage()
  }
  return globalVersion
}

function notifyListeners(version: Version) {
  globalVersion = version
  listeners.forEach(listener => listener(version))
}

export function useLandingPageVersion() {
  const [version, setVersion] = useState<Version>(getGlobalVersion)

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
