// app/api/auth/[auth0]/route.js
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';
export const GET = handleAuth({
  signup: handleLogin({
    authorizationParams: {
      login_hint: 'signup',
    }
  }),
  logout: handleLogout((req) => {
    let returnTo = "/";
    if("nextUrl" in req) {
      returnTo = req?.nextUrl.searchParams.get("returnTo") ?? "/"
    }
    return {
      returnTo,
    }
  }),
});