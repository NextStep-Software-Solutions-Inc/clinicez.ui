import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import maintenanceCheck from '@middlewares/maintenanceCheck';
import { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/clinics(.*)',
  '/organizations(.*)',
  '/settings(.*)',
  '/user(.*)',
  '/console(.*)',
  '/hp(.*)',
  '/v2(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/contact-us',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/maintenance',
  '/unauthorized',
  '/v2',
  '/v2/hp(.*)',
  '/v2/pricing(.*)',
  '/v2/terms(.*)',
  '/v2/privacy(.*)',
  '/v2/contact-us(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const maintenanceResponse = await maintenanceCheck(request);
  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
