"use server";

import prisma from "@lib/prisma-common";

import { HealthcareProviderType, Prisma } from "@prisma/common/client";
import { cache } from "react";

export type HPSFilters = {
  type?: HealthcareProviderType,
  userId?: string
  isPublished?: boolean
}

export type GetHPsType = Awaited<ReturnType<typeof getHPsAction>>
export const getHPsAction = cache(async (filters?:HPSFilters) => {
  const {type, userId, isPublished} = filters || {};
  const hps = prisma.healthcareProvider.findMany({
    where: {
      isActive: true,
      ...(type && { type }),
      ...(userId && { User: { userId } }),
      ...(isPublished && { isPublished })
    },
    include: {
      User: {
        select: {
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          suffix: true,
        }
      },
      HPProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          fields: true,
        }
      }
    }
  })

  return hps;
})

export type HPFilters = {
  id?: number,
  type?: HealthcareProviderType,
  userId?: string
  isPublished?: boolean
}
export type GetHP = Awaited<ReturnType<typeof getHPAction>>
export const getHPAction = async ({ userId, type, isPublished, id}:HPFilters) => {

  const hp = prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      ...(type && { type }),
      ...(isPublished && { isPublished }),
      OR: [
        { User: { userId } },
        { id }
      ]
    },
    include: {
      HPProfile: true,
      User: {
        include: {
          SocialLink: true
        }
      }
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

export const upsertHPAction = async (payload: Prisma.HPProfileUpsertArgs) => {
  const hpProfile = await prisma.hPProfile.upsert(payload)
  return hpProfile;
}

export const setIsPublishAction = async (hpId: number, isPublished: boolean) => {
  const hp = await prisma.healthcareProvider.update({
    where: { id: hpId },
    data: { isPublished }
  })
  return hp;
}

export type GetHpsByIds = Awaited<ReturnType<typeof getHpsByIdsAction>>
export const getHpsByIdsAction = async (ids: number[]) => {
  const hps = prisma.healthcareProvider.findMany({
    where: {
      id: {
        in: ids
      }
    },
    select: {
      id: true,
      type: true,
      User: {
        "select": {
          email: true,
        }
      },
      HPProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          fields: true,
        }
      }
    }
  })
  return hps;
}