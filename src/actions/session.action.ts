"use server";

import { getSession } from "@auth0/nextjs-auth0";
import { cache } from "react";

export const getCachedSession = cache(async () => {
  return await getSession();
});