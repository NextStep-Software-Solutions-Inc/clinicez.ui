import { createCustomFetch } from "./fetch";

export const request = createCustomFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  cache: "force-cache"
})

