import maintenanceCheck from '@middlewares/maintenanceCheck';
import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";


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
  
  // If maintenance check passed, continue to Auth0
  const authRes = await auth0.middleware(request); // Returns a NextResponse object

  const path = request.nextUrl.pathname;

  // Ensure your own middleware does not handle the `/auth` routes, auto-mounted and handled by the SDK
  if (path.startsWith("/auth")) {
    return authRes;
  }

  // Allow access to public routes without requiring a session
  if (publicRoutes.includes(path)) {
    return authRes;
  }

  // Any route that gets to this point will be considered a protected route, and require the user to be logged-in to be able to access it
  const { origin } = new URL(request.url)
  
  // Check for Auth0 session cookie instead of calling getSession()
  const sessionCookie = request.cookies.get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // If a valid session exists, continue with the response from Auth0 middleware
  // You can also add custom logic here...
  return authRes
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}