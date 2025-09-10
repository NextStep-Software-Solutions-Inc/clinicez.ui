"use server";

import { getAccessToken } from "@/lib/clerk-auth";

export const refreshTokensAction = async () => {
  try {
    const result = await getAccessToken()
    return result?.token || null;
  } catch (error) {
    let message = "Something went wrong!"
    if (error instanceof Error) {
      message = error.message
    }
    console.error("Failed to refresh token", message);
    return null;
  }
}