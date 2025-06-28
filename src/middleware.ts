import maintenanceCheck from '@middlewares/maintenanceCheck';
import { MiddlewareConfig, NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareStack } from '@middlewares/stackMiddleware';
import { auth0 } from "./lib/auth0";

const middleware = new MiddlewareStack();


middleware.use(maintenanceCheck);
middleware.use(auth0.middleware);

// export async function middleware(request: NextRequest) {
//   return await auth0.middleware(request);
// }

export default async function m(req: NextRequest, event: NextFetchEvent) {
  return middleware.execute(req, event);
};
  
export const config: MiddlewareConfig = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}