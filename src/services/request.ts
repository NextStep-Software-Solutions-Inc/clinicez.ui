import { createCustomFetch } from "./fetch";
import { authAtom, jotaiStore } from "../state/auth";


const { type, token} = jotaiStore.get(authAtom)

export const self = createCustomFetch({
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
  // cache: "force-cache",
  headers: {
    Authorization: `${type} ${token}`,
  },
  next: {
    revalidate: 30,
  }
})

