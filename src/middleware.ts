import maintenanceCheck from '@middlewares/maintenanceCheck';
import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";

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

  // For now, allow all routes to continue (Auth0 protection can be added per-page)
  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}