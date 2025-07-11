'use client'
 
import { Button } from '@components/ui/button'
import { useEffect } from 'react'
 
interface GlobalErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function GlobalError({ error, reset}: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className='overflow-hidden'>
      <Button variant="link" className='container mx-auto my-10 text-xs text-destructive text-wrap line-clamp-3' 
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }>
        {error.message}. Try again.
      </Button>
    </div>
  )
}