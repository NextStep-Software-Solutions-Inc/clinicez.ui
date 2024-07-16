import { MiddlewareConfig, NextResponse } from "next/server";
import {withMiddlewareAuthRequired} from "@auth0/nextjs-auth0/edge"

export default withMiddlewareAuthRequired(async function middleware(req) {
  const res = NextResponse.next();
  return res;
})

export const config: MiddlewareConfig = {
  matcher: []
}