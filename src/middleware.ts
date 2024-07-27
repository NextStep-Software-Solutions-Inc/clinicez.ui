import maintenanceCheck from '@middlewares/maintenanceCheck';
// import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { MiddlewareConfig, NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareStack } from '@middlewares/stackMiddleware';

const middleware = new MiddlewareStack();

middleware.use(maintenanceCheck);

export default (async function m(req: NextRequest, event: NextFetchEvent)  {
  return middleware.execute(req, event);
});
  
export const config: MiddlewareConfig = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}