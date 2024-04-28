'use client'
import GlobalError from "@components/GobalError"
// Error components must be Client Components

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({error,reset}: ErrorProps) {
  return (
    <GlobalError error={error} reset={reset}/>
  )
}