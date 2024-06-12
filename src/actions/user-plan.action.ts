"use server";

import prisma from "@lib/prisma";
import { Prisma, UserPlanStatus } from "@prisma/client";
import dayjs from "dayjs";

export const createUserPlanAction = async (planId: number, userId: number) => {
  const userPlan = await prisma.userPlan.create({
    data: {
      startDate: dayjs().toDate(),
      endDate: dayjs().add(1, "year").toDate(),
      planId,
      userId,
      status: "INACTIVE"
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