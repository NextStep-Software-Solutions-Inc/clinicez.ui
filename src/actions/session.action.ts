"use server";

import { cache } from "react";
import { getSession } from "@/lib/clerk-auth";

export const getCachedSession = cache(async () => {
  return await getSession();
});