"use server";

import prisma from "@lib/prisma";

import { cache } from "react";
import { HealthcareProviderType, Prisma } from "@prisma/client";
import { assignRolesAction } from "./user-management.action";
// import { self } from "@services/request";


export const getHPsActions = cache(async (type?: HealthcareProviderType) => {

  const hps = prisma.healthcareProvider.findMany({
    where: {
      isActive: true,
      ...(type && { type })
    },
    include: {
      DoctorProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          fields: true,
        }
      },
      NurseProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          fields: true,
        }
      },
    }
  })

  return hps;
})

export const getHPAction = cache(async ({id, userId}:{id?: number, userId?: string}) => {

  const hp = prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      User: {
        userId
      }
    },
    include: {
      DoctorProfile: true,
      NurseProfile: true,
    }
  })

  return hp;
})

export const createHpAction = async (hp: Prisma.HealthcareProviderCreateArgs["data"]) => {

  const newHp = await prisma.healthcareProvider.create({
    data: {
      ...hp
    }
  })

  return newHp;
}


export const submitHPApplicationAction = async ({
  hp, userId, roleId
}: {
  hp: Prisma.HealthcareProviderCreateArgs["data"],
  userId: string,
  roleId: string
}) => {

  const res = await prisma.$transaction(async (prisma) => {
    await prisma.healthcareProvider.create({
      data: {
        ...hp
      }
    });
    await assignRolesAction(userId, [roleId]);
    
    // const token = await self.get("/api/auth/refresh-token");
    return true
  })

  return res;

}