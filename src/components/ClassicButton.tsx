"use client"

import { Button } from "./ui/button"
import { setLandingPageVersion, useLandingPageVersion } from "./VersionSwitcher"
import { usePathname } from "next/navigation"

export default function ClassicButton() {
  const version = useLandingPageVersion()
  const pathname = usePathname()

  const handleClick = () => {
    // Save preference to localStorage
    setLandingPageVersion("v1")
    // Reload to apply the change
    window.location.reload()
  }

  // Only show on landing page when v2 is active, or on v2 routes
  const isV2Route = pathname.startsWith("/v2")
  const isLandingPage = pathname === "/"
  const shouldShow = isV2Route || (isLandingPage && version === "v2")

  if (!shouldShow) return null;

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      className="bg-transparent text-sm text-accent-foreground"
    >
      Switch to V1
    </Button>
  )
}
