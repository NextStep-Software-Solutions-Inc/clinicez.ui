"use server";

import prisma from "@lib/prisma";
import { cache } from "react";

export const getAllergensAction = cache(async () => {
  return await prisma.allergen.findMany({
    where: { isActive: true },
    select: {
      name: true,
    }
  });
});