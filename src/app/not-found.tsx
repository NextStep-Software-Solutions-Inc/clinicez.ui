"use client";

import { Button } from '@components/ui/button'
import { ArrowLeft, Home, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
 
export default function NotFound() {
  
  const router = useRouter()
  const goBack = () => router.back()
  return (
    <div className="container h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <Search size={90} className="w-full"/>
        <h2 className="text-4xl font-bold tracking-tight">404 &bull; Not Found</h2>
        <p className="text-sm text-muted-foreground">
          {`The requested resource could not be found. Please check the URL and try again.`}
        </p>
        <div className="my-5 gap-2 flex flex-wrap justify-center">
          <Button onClick={goBack}>
            <ArrowLeft className='mr-2 w-4 h-4'/>
            Go Back</Button>
          <Link href="/">
            <Button variant="outline">
              <Home className='mr-2 w-4 h-4'/>
              Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}