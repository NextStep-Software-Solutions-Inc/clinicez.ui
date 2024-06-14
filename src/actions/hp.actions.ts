"use server";

import prisma from "@lib/prisma";
import { put } from "@vercel/blob"

import { cache } from "react";
import { HealthcareProviderType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type HPFilters = {
  type?: HealthcareProviderType,
  userId?: string
  id?: number
}

export const getHPsActions = (async (filters?:HPFilters) => {
  const {type, userId, id} = filters || {};
  const hps = prisma.healthcareProvider.findMany({
    where: {
      isActive: true,
      ...(id && { id }),
      ...(type && { type }),
      ...(userId && { User: { userId } })
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

export const getHPAction = cache(async ({id, userId, type}:HPFilters) => {

  const hp = prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      ...(id && { id }),
      ...(type && { type }),
      ...(userId && { User: { userId } })
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

export const uploadMediaAction = async (formData: FormData) => {
  const media = formData.get("media") as File;
  const data = await put(media.name, media, {
    access: "public",
  })
  revalidatePath('/')
  return data
}