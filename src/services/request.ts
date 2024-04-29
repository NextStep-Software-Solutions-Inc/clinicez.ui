import { createCustomFetch } from "./fetch";

export const request = createCustomFetch({
  baseUrl: process.env.API_BASE_URL ?? "",
  cache: "no-store"
})

