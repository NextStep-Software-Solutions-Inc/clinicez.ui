import { createCustomFetch } from "./fetch";

export const self = createCustomFetch({
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
  cache: "force-cache",
})

