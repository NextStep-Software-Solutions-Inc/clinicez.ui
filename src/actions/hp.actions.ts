"use server";

import prisma from "@lib/prisma-common";

import { HealthcareProviderType, Prisma } from "@prisma/common/client";
import { cache } from "react";

export type HPFilters = {
  type?: HealthcareProviderType,
  userId?: string
  isPublished?: boolean
}

export type GetHPsType = Awaited<ReturnType<typeof getHPsAction>>
export const getHPsAction = cache(async (filters?:HPFilters) => {
  const {type, userId, isPublished} = filters || {};
  const hps = prisma.healthcareProvider.findMany({
    where: {
      isActive: true,
      ...(type && { type }),
      ...(userId && { User: { userId } }),
      ...(isPublished && { isPublished })
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

export const getHPAction = async ({ userId, type, isPublished}:HPFilters) => {

  const hp = prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      ...(type && { type }),
      ...(userId && { User: { userId } }),
      ...(isPublished && { isPublished })
    },
    include: {
      DoctorProfile: true,
      NurseProfile: true,
    }
  })

  return hp;
}

export const createHpAction = async (hp: Prisma.HealthcareProviderCreateArgs["data"]) => {

  const newHp = await prisma.healthcareProvider.create({
    data: {
      ...hp
    }
  })

  return newHp;
}

export const getProfessionalDetailsAction = async (hpId: number) => {
  const hp = prisma.professionalDetails.findFirst({
    where: {
      healthcareProverId: hpId
    }
  })
  return hp;

}

export const upsertProfessionalDetailsAction = async (payload: Prisma.ProfessionalDetailsUpsertArgs) => {
  const hp = await prisma.professionalDetails.upsert(payload)
  return hp;
}

export const setIsPublishAction = async (hpId: number, isPublished: boolean) => {
  
  const hp = await prisma.healthcareProvider.update({
    where: { id: hpId },
    data: { isPublished }
  })
  return hp;
}