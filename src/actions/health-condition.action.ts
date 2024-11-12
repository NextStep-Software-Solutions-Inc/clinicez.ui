"use server";

import prisma from "@lib/prisma";
import { cache } from "react";

export const addHealthConditionAction = async ({name}: {name: string}) => {
  return await prisma.healthCondition.create({
    data: {
      name,
    }
  })
};

export const getHealthConditionsAction = cache(async () => {
  return await prisma.healthCondition.findMany({
    where:{ isActive: true },
    select: {
      id: true,
      name: true
    }
  })
})

export const updateHealthConditionAction = async ({id, name}: { name: string, id: number}) => {
  return await prisma.healthCondition.update({
    where: { id, isActive: true },
    data: { name }
  })
}

export const deleteHealthConditionAction = async (id: number) => {
  return await prisma.healthCondition.delete({
    where: { id, isActive: true }
  })
}
