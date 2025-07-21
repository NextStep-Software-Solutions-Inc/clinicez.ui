"use server";

import { cache } from "react";
import { getSession, getAccessToken } from "@/lib/auth0";

export const getCachedSession = cache(async () => {
  return await getSession();
});

export const getAccessTokenAction = cache(async () => {
  try {
    const result = await getAccessToken();
    if (!result) return null;
    return {
      type: "Bearer",
      token: result.token
    }
  } catch (error: any) {
    if (error?.code === 'missing_session') {
      return null;
    }
    console.error("Failed to get access token:", error);
    return null;
  }
});