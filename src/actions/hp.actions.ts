"use server";

import prisma from "@lib/prisma";

import { cache } from "react";
import { HealthcareProviderType, Prisma } from "@prisma/client";


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

export const getHPAction = cache(async (id: number) => {

  const hp = prisma.healthcareProvider.findUnique({
    where: {
      isActive: true,
      id
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