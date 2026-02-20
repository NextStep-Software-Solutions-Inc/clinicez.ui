'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ClinicPatientEditError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[ClinicPatientEditError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
      <div className="flex items-center gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <h2 className="text-xl font-semibold">Failed to load edit form</h2>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || 'An unexpected error occurred while loading the patient edit form.'}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
