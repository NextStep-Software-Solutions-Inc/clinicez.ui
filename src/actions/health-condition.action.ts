"use server";

import prisma from "@lib/prisma";
import { cache } from "react";
import type { HealthCondition, ActionResponse } from "@/types/health-history.types";

export const addHealthConditionAction = async ({ name }: { name: string }) => {
  return await prisma.healthCondition.create({
    data: {
      name,
    }
  })
};

/**
 * Get all active health conditions (cached for performance)
 * Used for populating condition dropdowns/multi-selects
 */
export const getHealthConditionsAction = cache(async () => {
  return await prisma.healthCondition.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      isActive: true,
    }
  })
});

/**
 * Get condition by name
 * Useful for mapping condition names to IDs
 */
export const getHealthConditionByName = cache(async (name: string) => {
  return await prisma.healthCondition.findUnique({
    where: { name },
  });
});

/**
 * Get multiple conditions by names
 * Useful for batch lookups
 */
export const getHealthConditionsByNames = cache(async (names: string[]) => {
  return await prisma.healthCondition.findMany({
    where: {
      name: { in: names },
      isActive: true,
    },
  });
});

/**
 * Get condition ID map for quick lookups
 * Returns a map of condition name -> condition ID
 */
export const getConditionIdMap = cache(async (): Promise<Record<string, number>> => {
  const conditions = await prisma.healthCondition.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  return conditions.reduce((acc, condition) => {
    acc[condition.name] = condition.id;
    return acc;
  }, {} as Record<string, number>);
});

export const updateHealthConditionAction = async ({ id, name }: { name: string, id: number }) => {
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
