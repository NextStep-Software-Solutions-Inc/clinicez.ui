"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { setLandingPageVersion } from "./VersionSwitcher"

export default function ModernButton() {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = () => {
    // Only show on v1 pages (not starting with /v2)
    if (!pathname.startsWith("/v2")) {
      // Save preference to localStorage
      setLandingPageVersion("v2")
      
      // Navigate to v2 version of the page
      const path = pathname === "/" ? "/v2" : `/v2${pathname}`
      router.push(path)
    }
  }

  // Only show on v1 pages
  if (pathname.startsWith("/v2")) return null;

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
