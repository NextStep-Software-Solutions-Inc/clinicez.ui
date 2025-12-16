"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { setLandingPageVersion } from "./VersionSwitcher"

export default function ClassicButton() {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = () => {
    if (pathname.startsWith("/v2")) {
      // Save preference to localStorage
      setLandingPageVersion("v1")
      
      const path = pathname.replace(/^\/v2/, "")
      router.push(path || "/")
    }
  }

  if (!pathname.startsWith("/v2")) return null;

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
