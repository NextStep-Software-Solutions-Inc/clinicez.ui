"use server";

import { getAccessToken } from "@auth0/nextjs-auth0";
export const refreshTokensAction = async () => {
  try {
    const token = await getAccessToken()
    return token;
  } catch (error) {
    let message = "Something went wrong!"
    if(error instanceof Error) {
      message = error.message
    }
    console.error("Failed to refresh token", message);
    return null;
  }
}