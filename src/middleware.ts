import maintenanceCheck from '@middlewares/maintenanceCheck';
import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0/edge";

const publicRoutes = [
  "/",
]

export async function middleware(request: NextRequest) {
  // run maintenance check first
  const maintenanceResponse = await maintenanceCheck(request);
  
  // If maintenance check returns a response (maintenance mode, unauthorized, etc.), return it
  if (maintenanceResponse) {
    return maintenanceResponse;
  }
  
  const path = request.nextUrl.pathname;

  // Allow access to auth routes 
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow access to public routes without requiring a session
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Any route that gets to this point will be considered a protected route
  const { origin } = new URL(request.url)
  
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.redirect(`${origin}/api/auth/login`)
    }

    // If a valid session exists, continue
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(`${origin}/api/auth/login`)
  }
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}