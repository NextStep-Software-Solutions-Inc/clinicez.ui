"use client";

import { Button } from '@components/ui/button'
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation'
 
export default function NotFound() {
  const router = useRouter()
  const goBack = () => router.back()
  return (
    <div className='prose'>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Button onClick={goBack}><ArrowLeft/> Go Back </Button>
    </div>
  )
}