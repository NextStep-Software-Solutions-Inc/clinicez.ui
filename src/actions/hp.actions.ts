"use server";

import prisma from "@lib/prisma";

import { Prisma } from "@prisma/client";
import { cache } from "react";

// Get total healthcare provider job titles
export const getHPTypeCounts = async () => {
  const types = await prisma.healthcareProviderType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      HealthcareProviders: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
    count: type.HealthcareProviders.length,
  })).sort((a, b) => b.count - a.count);
};

export type GetHPTypeCountsType = Awaited<ReturnType<typeof getHPTypeCounts>>;



export type HPSFilters = {
  hpTypeId?: number,
  userId?: string
  isPublished?: boolean
  clinicUid?: string
}

export type GetHPsType = Awaited<ReturnType<typeof getHPsAction>>
export const getHPsAction = cache(async (filters?: HPSFilters) => {

  const { hpTypeId, userId, isPublished, clinicUid } = filters || {};
  const hps = await prisma.healthcareProvider.findMany({
    orderBy: {
      HPProfile: { name: "asc" }
    },
    where: {
      isActive: true,
      ...(hpTypeId ? { hpTypeId } : {}),
      ...(userId ? { User: { userId } } : {}),
      ...(isPublished ? { isPublished } : {}),
      ...(clinicUid ? {
        ClinicMembers: {
          some: {
            clinicUid: clinicUid,
            isActive: true
          }
        }
      } : {})
    },
    include: {
      HPType: {
        select: { id: true, name: true }
      },
      User: {
        select: {
          userId: true,
          email: true,
          gender: true,
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
  hpTypeId?: number,
  userId?: string
  isPublished?: boolean
}
export type GetHP = Awaited<ReturnType<typeof getHPAction>>
export const getHPAction = async ({ userId, hpTypeId, isPublished, id }: HPFilters) => {

  const hp = await prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      ...(hpTypeId ? { hpTypeId } : {}),
      ...(isPublished ? { isPublished } : {}),
      OR: [
        { User: { userId } },
        { id }
      ]
    },
    include: {
      HPProfile: true,
      HPType: {
        select: {
          id: true,
          name: true
        }
      },
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
  const hp = await prisma.professionalDetails.findFirst({
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
  const hps = await prisma.healthcareProvider.findMany({
    where: {
      id: {
        in: ids
      },
      isActive: true
    },
    orderBy: {
      HPProfile: { name: "asc" }
    },
    select: {
      id: true,
      HPType: {
        select: {
          id: true,
          name: true
        }
      },
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
}