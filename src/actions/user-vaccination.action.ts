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

export const createUserVaccinationAction = async ({userId, vaccineId, routeId, doseId, dateGiven, administeredBy}:UserVaccinationPayloadType) => {
  return await prisma.userVaccination.create({
    data: {
      User: {
        connect: { userId }
      },
      Vaccine: {
        connect: { id: vaccineId }
      },
      VaccineRoute: {
        connect: { id: routeId }
      },
      VaccineDose: {
        connect: { id: doseId }
      },
      dateGiven,
      administeredBy,
    }
  });
}

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
      VaccineRoute: {
        select: {
          id: true,
          route: true
        }
      },
      VaccineDose: {
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

export const updateUserVaccinationAction = async (id: number, {vaccineId, routeId, doseId, dateGiven, administeredBy}:UserVaccinationPayloadType) => {
  return await prisma.userVaccination.update({
    where: { id, isActive: true },
    data: {
      Vaccine: {
        connect: { id: vaccineId }
      },
      VaccineRoute: {
        connect: { id: routeId }
      },
      VaccineDose: {
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