import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export default async function maintenanceCheck(req: NextRequest) {

  if (process.env.NEXT_PUBLIC_BUILD_ENV !== "production") {
    return NextResponse.next()
  }

  if (!process.env.EDGE_CONFIG) {
    req.nextUrl.pathname = `/unauthorized`
    return NextResponse.rewrite(req.nextUrl)
  }

  try {
    // Check whether the maintenance page should be shown
    const isInMaintenanceMode = await get<boolean>('maintenanceMode')

    // If is in maintenance mode, point the url pathname to the maintenance page
    if (isInMaintenanceMode) {
      req.nextUrl.pathname = `/maintenance`

      // Rewrite to the url
      return NextResponse.rewrite(req.nextUrl)
    }
  } catch (error) {
    // show the default page if EDGE_CONFIG env var is missing,
    // but log the error to the console
    console.error(error)
  }
}