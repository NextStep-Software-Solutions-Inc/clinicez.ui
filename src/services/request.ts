import { getAccessToken } from "@auth0/nextjs-auth0";
import { createCustomFetch } from "./fetch";

export const request = createCustomFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  cache: "force-cache"
})

export const self = createCustomFetch({
  baseUrl: process.env.AUTH0_BASE_URL ?? "",
  cache: "force-cache",
  headers: {
    "Authorization": `Bearer ${await (async () => (await getAccessToken()).accessToken)()}`
  }
})
