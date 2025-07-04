import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  appBaseUrl: process.env.APP_BASE_URL,
  domain: process.env.AUTH0_DOMAIN,
  authorizationParameters: {
    redirect_uri: `${process.env.APP_BASE_URL}/auth/callback`,
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  }
});