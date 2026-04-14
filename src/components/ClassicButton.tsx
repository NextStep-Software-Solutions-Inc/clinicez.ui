"use client"

import { Button } from "./ui/button"
import { setLandingPageVersion, useLandingPageVersion } from "./VersionSwitcher"
import { usePathname, useRouter } from "next/navigation"

export default function ClassicButton() {
  const version = useLandingPageVersion()
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = () => {
    // Save preference to localStorage and notify all listeners
    setLandingPageVersion("v1")
    // Navigate back to the classic (v1) landing page
    if (pathname.startsWith("/v2")) {
      router.push("/")
    }
  }

  // Only show on landing page when v2 is active, or on v2 routes
  const isV2Route = pathname.startsWith("/v2")
  const isLandingPage = pathname === "/"
  const shouldShow = isV2Route || (isLandingPage && version === "v2")

  if (!shouldShow) return null;

  return (
    <button
      onClick={handleClick}
      className="text-primary-foreground hover:underline cursor-pointer transition-all"
    >
      Back to Classic Version
    </button>
  )
}
