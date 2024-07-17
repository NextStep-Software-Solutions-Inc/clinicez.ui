"use server";

import { getAccessToken } from "@auth0/nextjs-auth0";
export const refreshTokensAction = async () => {
  try {
    const token = await getAccessToken({
      refresh: true
    })
    return token;
  } catch (error) {
    console.error("Failed to refresh token", error);
    return null;
  }
}