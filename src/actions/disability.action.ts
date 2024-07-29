"use server";

import prisma from "@lib/prisma-common";
import { cache } from "react";

export const addDisabilityAction = async ({name}: {name: string}) => {
  return await prisma.disability.create({
    data: {
      name,
    }
  })
};

export const getDisabilityAction = cache(async () => {
  return await prisma.disability.findMany({
    where:{ isActive: true },
    select: {
      id: true,
      name: true
    }
  })
})

export const updateDisabilityAction = async ({id, name}: { name: string, id: number}) => {
  return await prisma.disability.update({
    where: { id, isActive: true },
    data: { name }
  })
}

export const deleteDisabilityAction = async (id: number) => {
  return await prisma.disability.delete({
    where: { id, isActive: true }
  })
}
