"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useLandingPageVersion } from "@/components/VersionSwitcher"

const NOTIFICATION_VERSION = "v2-announcement-2024"
const STORAGE_KEY = "clinic-ez-notifications"

interface NotificationState {
  version: string
  dismissed: boolean
  timestamp: number
}

export function NotificationBanner() {
  const [showNotification, setShowNotification] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const currentVersion = useLandingPageVersion()

  useEffect(() => {
    const checkNotificationStatus = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const notificationState: NotificationState | null = stored ? JSON.parse(stored) : null

        const shouldShow =
          !notificationState ||
          notificationState.version !== NOTIFICATION_VERSION

        setShowNotification(shouldShow && !notificationState?.dismissed)
        setIsLoaded(true)
      } catch (error) {
        console.error("Error reading notification state:", error)
        setShowNotification(true)
        setIsLoaded(true)
      }
    }

    checkNotificationStatus()
  }, [])

  const dismissNotification = () => {
    try {
      const notificationState: NotificationState = {
        version: NOTIFICATION_VERSION,
        dismissed: true,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationState))
      setShowNotification(false)
    } catch (error) {
      console.error("Error saving notification state:", error)
      setShowNotification(false)
    }
  }

  // Don't show banner if already on v2 or if not loaded or dismissed
  if (!isLoaded || !showNotification || currentVersion === "v2") {
    return null
  }

  return (
    <div className="bg-accent-foreground text-white px-4 py-3 relative">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Sparkles className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-medium">Clinic EZ V2 is Here!</span>
            <span className="text-sm opacity-90">
              Experience our new design of ClinicEZ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Link href="/v2" className="flex items-center gap-1">
              Try V2
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={dismissNotification}
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
