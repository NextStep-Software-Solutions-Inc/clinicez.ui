"use client"

import { Button } from "./ui/button"
import { setLandingPageVersion, useLandingPageVersion } from "./VersionSwitcher"
import { usePathname } from "next/navigation"

export default function ModernButton() {
  const version = useLandingPageVersion()
  const pathname = usePathname()

  const handleClick = () => {
    // Save preference to localStorage and notify all listeners
    setLandingPageVersion("v2")
  }

  // Only show on landing page when v1 is active, and not on v2 routes
  const isV2Route = pathname.startsWith("/v2")
  const isLandingPage = pathname === "/"
  const shouldShow = !isV2Route && isLandingPage && version === "v1"

  if (!shouldShow) return null;

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      className="bg-transparent text-sm text-accent-foreground"
    >
      Switch to V2
    </Button>
  )
}
