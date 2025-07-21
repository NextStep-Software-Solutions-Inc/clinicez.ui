import { initAuth0 } from "@auth0/nextjs-auth0";

export const auth0 = initAuth0({
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  routes: {
    callback: process.env.AUTH0_CALLBACK_URL || '/api/auth/callback',
    postLogoutRedirect: process.env.AUTH0_POST_LOGOUT_REDIRECT_URI || '/'
  }
});