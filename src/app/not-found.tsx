import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className='container mx-auto px-4 mt-10'>
      <div className="prose max-w-full">
        <h2>404 &bull; Page Not Found</h2>
        <p>Could not find requested resource</p>
        <Link href="/">Return Home</Link>
      </div>
    </div>
  )
}