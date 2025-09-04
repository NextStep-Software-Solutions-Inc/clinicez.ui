import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

// import maintenanceCheck from '@middlewares/maintenanceCheck';
// import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
// import { auth0 } from '@/lib/auth0';

// const publicRoutes = [
//   "/",
// ]

// export async function middleware(request: NextRequest) {
//   const maintenanceResponse = await maintenanceCheck(request);

//   if (maintenanceResponse) {
//     return maintenanceResponse;
//   }

//   const authResponse = await auth0.middleware(request);

//   const path = request.nextUrl.pathname;

//   if (path.startsWith("/auth")) {
//     return authResponse;
//   }

//   if (publicRoutes.includes(path)) {
//     return authResponse;
//   }

//   return authResponse;
// }

// export const config: MiddlewareConfig = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
//   ],
// }
