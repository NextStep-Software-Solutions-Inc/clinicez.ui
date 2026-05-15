'use client'

import { ProfileErrorBoundary } from './profile-error-boundary'

/**
 * Error Boundary for Edit Profile Page
 *
 * Catches errors thrown during ProfileLoader execution
 * and displays a user-friendly error UI with retry option.
 *
 * Next.js App Router error boundary pattern.
 */
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return <ProfileErrorBoundary error={error} reset={reset}>{null}</ProfileErrorBoundary>
}
