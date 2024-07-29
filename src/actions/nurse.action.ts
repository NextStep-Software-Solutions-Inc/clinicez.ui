"use server";

import prisma from "@lib/prisma-common";
import { Prisma } from "@prisma/client";

export const getNursesAction = async () => {
  const nurses = await prisma.nurseProfile.findMany({
    where: {
      isActive: true,
      HealthcareProvider: {
        isPublished: true
      }
    },
  })
  return nurses;
}

export const getNurseAction = async (hpId: number) => {
  const nurse = await prisma.nurseProfile.findUnique({
    where: {
      isActive: true,
      healthcareProviderId: hpId
    },
    include: {
      HealthcareProvider: {
        select: {
          isPublished: true,
          User: {
            select: {
              userId: true,
              SocialLink: true
            }
          }
        }
      }
    }
  })
  return nurse;
}


export const createNurseAction = async (nurse: Prisma.NurseProfileCreateArgs["data"]) => {
  const newNurse = await prisma.nurseProfile.create({
    data: {
      ...nurse
    }
  })
  return newNurse;
}

export const upsertNurseAction = async (payload: Prisma.NurseProfileUpsertArgs) => {
  const newNurse = await prisma.nurseProfile.upsert(payload)
  return newNurse;
}