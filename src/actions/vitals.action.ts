"use server";

import prisma from "@lib/prisma";
import { cache } from 'react';

const calculateBMI = (weight: number, height: number) => {
  return weight / Math.pow(height / 100, 2);

}

type BaseVitalSign = {
  dateTaken: Date;
  temp?: number;
  pulseRate?: number;
  respRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  notes?: string;
}
export const createUserVitalSignAction = async (payload: BaseVitalSign & { userId: string }) => {
  const { userId, ...res } = payload;

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  return await prisma.vitalSign.create({
    data: {
      User: {
        connect: {
          id: currentUser.id
        }
      },
      ...res,
      ...(res.height && res.weight ? { bmi: calculateBMI(res.weight, res.height) } : {}),
    },
  });
}


export type GetUserVitalSigns = Awaited<ReturnType<typeof getUserVitalSignsAction>>;
export const getUserVitalSignsAction = cache(async (unique: string) => {
  return await prisma.vitalSign.findMany({
    orderBy: {
      createdAt: "asc"
    },
    where: {
      isActive: true,
      User: {
        OR: [
          { userId: unique },
          { email: unique }]
      }
    }
  });
})

export const getUserVitalSignAction = cache(async (vitalsId: number) => {
  return await prisma.vitalSign.findUnique({
    where: {
      isActive: true,
      id: vitalsId
    }
  });
})

export const updateUserVitalSignAction = async (vitalsId: number, payload: BaseVitalSign) => {
  return await prisma.vitalSign.update({
    where: {
      isActive: true,
      id: vitalsId
    },
    data: {
      ...payload,
      ...(payload.height && payload.weight ? { bmi: calculateBMI(payload.weight, payload.height) } : {}),
    }
  });
}

export const deleteUserVitalSignAction = async (vitalsId: number) => {
  return await prisma.vitalSign.update({
    where: {
      isActive: true,
      id: vitalsId
    },
    data: {
      isActive: false
    }
  });
}