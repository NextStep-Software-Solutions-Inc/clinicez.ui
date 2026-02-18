'use client'

import React, { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'

export type ErrorVariant = 'error' | 'warning' | 'info' | 'success'

export interface ErrorDisplayProps {
  message?: string
  variant?: ErrorVariant
  onDismiss?: () => void
  autoDismissMs?: number
}

/**
 * ErrorDisplay - User-friendly error/warning/info messages
 * User-centric: Color-coded, dismissible, auto-dismisses for info
 */
export function ErrorDisplay({
  message,
  variant = 'error',
  onDismiss,
  autoDismissMs,
}: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!autoDismissMs || variant === 'error') return

    const timer = setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, autoDismissMs)

    return () => clearTimeout(timer)
  }, [autoDismissMs, variant, onDismiss])

  if (!message || !isVisible) return null

  const config = {
    error: {
      icon: AlertCircle,
      className: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
      titleClass: 'text-red-900 dark:text-red-100',
      descClass: 'text-red-800 dark:text-red-200',
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950',
      titleClass: 'text-yellow-900 dark:text-yellow-100',
      descClass: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
      titleClass: 'text-blue-900 dark:text-blue-100',
      descClass: 'text-blue-800 dark:text-blue-200',
    },
    success: {
      icon: CheckCircle2,
      className: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
      titleClass: 'text-green-900 dark:text-green-100',
      descClass: 'text-green-800 dark:text-green-200',
    },
  }[variant]

  const Icon = config.icon

  return (
    <Alert className={config.className}>
      <Icon className="h-4 w-4" />
      <AlertDescription className={config.descClass}>{message}</AlertDescription>
      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false)
            onDismiss()
          }}
          className="absolute right-2 top-2"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  )
}
