"use server";

import prisma from "@lib/prisma";
import { cache } from "react";

type UserVaccinationPayloadType = {
  userId: string,
  vaccineId: number,
  routeId: number,
  doseId: number,
  dateGiven: Date,
  administeredBy: string
}

export const createUserVaccinationAction = async ({ userId, vaccineId, routeId, doseId, dateGiven, administeredBy }: UserVaccinationPayloadType) => {
  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  return await prisma.userVaccination.create({
    data: {
      User: {
        connect: { id: currentUser.id }
      },
      Vaccine: {
        connect: { id: vaccineId }
      },
      Route: {
        connect: { id: routeId }
      },
      Dose: {
        connect: { id: doseId }
      },
      dateGiven,
      administeredBy,
    }
  });
}

export type GetUserVaccinations = Awaited<ReturnType<typeof getUserVaccinationsAction>>
export const getUserVaccinationsAction = cache(async (userId: string) => {
  return await prisma.userVaccination.findMany({
    orderBy: {
      dateGiven: 'desc'
    },
    where: {
      isActive: true,
      User: {
        userId
      },
    },
    select: {
      id: true,
      Vaccine: {
        select: {
          id: true,
          type: true,
          name: true
        }
      },
      Route: {
        select: {
          id: true,
          route: true
        }
      },
      Dose: {
        select: {
          id: true,
          dose: true
        }
      },
      dateGiven: true,
      administeredBy: true
    }
  });
})

export const updateUserVaccinationAction = async (id: number, { vaccineId, routeId, doseId, dateGiven, administeredBy }: UserVaccinationPayloadType) => {
  return await prisma.userVaccination.update({
    where: { id, isActive: true },
    data: {
      Vaccine: {
        connect: { id: vaccineId }
      },
      Route: {
        connect: { id: routeId }
      },
      Dose: {
        connect: { id: doseId }
      },
      dateGiven,
      administeredBy,
    }
  });
}

export const deleteUserVaccinationAction = async (id: number) => {
  return await prisma.userVaccination.update({
    where: { id, isActive: true },
    data: { isActive: false }
  });
}