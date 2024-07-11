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
    <Button variant="link" className='container mx-auto my-10 text-xs text-destructive  text-wrap' 
      onClick={
      // Attempt to recover by trying to re-render the segment
        () => reset()
      }>
      {/* <div className='text-destructive border border-destructive rounded-lg p-5'>
        <h3></h3>
        <div className='prose max-w-full'>
          <pre>{error.message}</pre>
        </div>
        <Button 
          className='mt-5'
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }>Try Again</Button>
      </div> */}
      {error.message}. Try again.
    </Button>
  )
}