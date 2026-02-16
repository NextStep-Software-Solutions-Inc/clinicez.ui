'use client'

import React, { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export interface LoadingStateProps {
  isLoading: boolean
  itemCount?: number
  children?: ReactNode
}

/**
 * LoadingState - Skeleton placeholders while data loads
 * User-centric: Smooth loading experience, matches content structure
 */
export function LoadingState({ isLoading, itemCount = 1, children }: LoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
