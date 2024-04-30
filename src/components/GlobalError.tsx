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
    <div className='container mx-auto mt-10'>
      <div className='text-destructive border border-destructive rounded-lg p-5'>
        <h3>{error.name}</h3>
        <div className='prose max-w-full'>
          <pre>{error.message}</pre>
        </div>
        <Button 
          className='mt-5'
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }>Try Again</Button>
      </div>
    </div>
  )
}