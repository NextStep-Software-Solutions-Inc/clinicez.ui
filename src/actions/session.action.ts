"use server";

import { cache } from "react";
import { getSession } from "@/lib/auth0";

export const getCachedSession = cache(async () => {
  return await getSession();
});