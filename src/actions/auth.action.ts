"use server";

import { getAccessToken } from "@auth0/nextjs-auth0";
export const refreshTokensAction = async () => {
  try {
    const result = await getAccessToken()
    return result?.accessToken || null;
  } catch (error) {
    let message = "Something went wrong!"
    if(error instanceof Error) {
      message = error.message
    }
    console.error("Failed to refresh token", message);
    return null;
  }
}