"use server";

import { getSession } from "@auth0/nextjs-auth0";
import { cache } from "react";

export const getCachedSession = cache(async () => {
  return await getSession();
});

export const getAccessTokenAction = cache(async () => {
  const session = await getCachedSession();
  if(!session) return null;
  return {
    type: session.token_type,
    token: session.accessToken
  }
  
});