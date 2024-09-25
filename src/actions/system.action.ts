"use server";

import prismaTenant from "@lib/prisma-tenant";
import { cache } from "react";

export type GetSystems = Awaited<ReturnType<typeof getSystemsAction>>;
export const getSystemsAction = cache(async (orgUid?:string) => {
  return await prismaTenant.system.findMany({
    where: { 
      isActive: true,
      ...orgUid? {orgUid} : {}
    },
    select: {
      id: true,
      name: true,
    }
  });
});