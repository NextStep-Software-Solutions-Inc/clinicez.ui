import { createCustomFetch } from "./fetch";

export const self = createCustomFetch({
  baseUrl: process.env.AUTH0_BASE_URL ?? "",
  cache: "force-cache",
})

