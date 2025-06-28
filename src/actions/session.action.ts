"use server";

import { cache } from "react";
import { auth0 } from "@/lib/auth0";

export const getCachedSession = cache(async () => {
  return await auth0.getSession();
});

export const getAccessTokenAction = cache(async () => {
  const session = await getCachedSession();
  if(!session) return null;
  return {
    type: session.token_type,
    token: session.accessToken
  }
  
});