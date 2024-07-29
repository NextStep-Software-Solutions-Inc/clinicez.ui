"use server";

import prisma from "@lib/prisma-common";
import { cache } from "react";

export const getAllergensAction = cache(async () => {
  return await prisma.allergen.findMany({
    where: { isActive: true },
    select: {
      name: true,
    }
  });
});