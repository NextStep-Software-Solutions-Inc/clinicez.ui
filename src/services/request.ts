import { createCustomFetch } from "./fetch";
import { authAtom } from "../state/auth";
import { jotaiStore } from "@state/store";

const { type, token} = jotaiStore.get(authAtom)

export const self = createCustomFetch({
  baseUrl: (!!process.env.VERCEL_ENV ? process.env.VERCEL_URL : undefined),
  // cache: "force-cache",
  headers: {
    Authorization: `${type} ${token}`,
    "Content-Type": "application/json",
    "Allow-Control-Allow-Origin": "*",
  },
  next: {
    revalidate: 30,
  }
})

