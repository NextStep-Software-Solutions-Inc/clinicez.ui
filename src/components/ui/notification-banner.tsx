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
    <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-800 dark:via-teal-700 dark:to-cyan-700 text-white px-4 py-2.5">
      {/* Subtle shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/5" />

      <div className="container relative mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
            <span className="font-semibold text-sm leading-tight">
              Clinic EZ V2 is Here!
            </span>
            <span className="hidden sm:inline text-white/60 text-sm">·</span>
            <span className="text-xs sm:text-sm text-white/80 truncate">
              Experience our new design of ClinicEZ
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Button
            asChild
            size="sm"
            className="h-8 bg-white text-teal-700 hover:bg-white/90 font-semibold text-xs px-3 shadow-sm dark:text-teal-800"
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
