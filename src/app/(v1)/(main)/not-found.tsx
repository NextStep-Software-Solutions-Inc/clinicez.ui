import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 • Page Not Found | Clinic EZ',
  description: 'Could not find requested resource',
}
 
export default function NotFound() {
  return (
    <div className='content container mx-auto text-center px-4 mt-10'>
      <div className="prose max-w-full">
        <h2>404 &bull; Page Not Found</h2>
        <p>Could not find requested resource</p>
        <Link href="/">Return Home</Link>
      </div>
    </div>
  )
}