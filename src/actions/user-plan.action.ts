"use server";

import prisma from "@lib/prisma";
import { Prisma, UserPlanStatus } from "@prisma/client";
import dayjs from "dayjs";

export const createUserPlanAction = async (planId: number, userId: number, status: UserPlanStatus = "PENDING") => {
  const userPlan = await prisma.userPlan.create({
    data: {
      startDate: dayjs().toDate(),
      endDate: dayjs().add(1, "year").toDate(),
      planId,
      userId,
      status
    }
  });
  return userPlan;
}

export const upsertUserPlanAction = async (payload: Prisma.UserPlanUpsertArgs) => {
  const userPlan = await prisma.userPlan.upsert(payload);
  return userPlan;
}

export const setUserPlanStatusAction = async (id: number, status: UserPlanStatus) => {
  const userPlan = await prisma.userPlan.update({
    where: { id },
    data: { status }
  });
  return userPlan;
}

export const hpApplicationTransactionAction = async ({
  planPayload : {planId, userId, status = "PENDING"},
  hpPayload
}: {
  planPayload: {planId: number, userId: number, status: UserPlanStatus};
  hpPayload: Prisma.HealthcareProviderCreateArgs["data"];

}) => {
  const success = await prisma.$transaction(async (prisma) => {
    await prisma.userPlan.create({
      data: {
        startDate: dayjs().toDate(),
        endDate: dayjs().add(1, "year").toDate(),
        planId,
        userId,
        status
      }
    }),
    await prisma.healthcareProvider.create({
      data: {
        ...hpPayload, 
        ...hpPayload.type === "DOCTOR" && {
          DoctorProfile: {
            create: {
              name: "",
              title: "",
            }
          }
        },
        ...hpPayload.type === "NURSE" && {
          NurseProfile: {
            create: {
              name: "",
              title: "",
            }
          }
        }
      }
    })

    return true;
  })
  return success;
}

export const getUserPlansAction = async (userId: string) => {
  const userPlans = await prisma.userPlan.findMany({
    where: {
      User: {
        userId: userId
      },
      isActive: true 
    },
    include: { 
      Plan: {
        select: {
          name: true,
          type: true,
        }
      }
    }
  });
  return userPlans;
}