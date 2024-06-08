"use server";

import { createCustomFetch } from "./fetch";
import { headers } from "next/headers";

export const request = createCustomFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  cache: "force-cache"
})


export const self =  createCustomFetch({
  baseUrl: process.env.AUTH0_BASE_URL ?? "",
  cache: "force-cache",
  headers: headers()
})

