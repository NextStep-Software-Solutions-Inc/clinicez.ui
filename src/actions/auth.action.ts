"use server";

import { getAccessToken } from "@auth0/nextjs-auth0";
import { redirect, RedirectType } from "next/navigation";


export const refreshTokensAction = async (currentPath:string) => {
  try {
    const token = await getAccessToken({
      refresh: true
    })
    return token;
  } catch (error) {
    console.error(error);
    redirect(`/api/auth/login?returnTo=${currentPath}`, RedirectType.push)
  }
}