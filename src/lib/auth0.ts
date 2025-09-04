// Server-side Clerk compatibility helpers
// Purpose: provide a small, typed adapter so existing server code that expects
// `session.user.sub` and `getAccessToken()` keeps working while using Clerk.
// Implementation follows Clerk's App Router recommendations: use `auth()` from
// `@clerk/nextjs/server` inside server actions / server components.

import { auth, currentUser } from "@clerk/nextjs/server";

export type SessionShape = {
  user: {
    sub: string;
    id?: number;
    email?: string | null;
    given_name?: string | null;
    family_name?: string | null;
  };
};

// Returns a session-shaped object compatible with previous callers or null when
// the user is not authenticated.
export const getSession = async (): Promise<SessionShape | null> => {
  const result = await auth();
  const { userId } = result;
  if (!userId) return null;

  // Fetch fuller user data when available (Server-side helper)
  const user = await currentUser();

  // No local DB mapper available here; use Clerk's server-side user fields
  const id = undefined;
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const given_name = user?.firstName ?? null;
  const family_name = user?.lastName ?? null;

  return {
    user: {
      sub: userId,
      id,
      email,
      given_name,
      family_name,
    },
  };
};

// Returns an object with a `token` property (string | null) to preserve the
// shape used across the codebase.
export const getAccessToken = async (): Promise<{ token: string | null }> => {
  const result = await auth();
  // auth().getToken() returns a string or null/undefined depending on session
  const token = await result.getToken();
  return { token: token ?? null };
};

// import { Auth0Client } from '@auth0/nextjs-auth0/server';

// export const auth0 = new Auth0Client({
//   domain: process.env.AUTH0_DOMAIN!,
//   clientId: process.env.AUTH0_CLIENT_ID!,
//   clientSecret: process.env.AUTH0_CLIENT_SECRET!,
//   secret: process.env.AUTH0_SECRET!,
//   appBaseUrl: process.env.APP_BASE_URL ?? "secret",
//   authorizationParameters: {
//     audience: process.env.AUTH0_AUDIENCE,
//     scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
//   },
// });

// // Export convenient access to methods
// export const getSession = () => auth0.getSession();
// export const getAccessToken = () => auth0.getAccessToken();