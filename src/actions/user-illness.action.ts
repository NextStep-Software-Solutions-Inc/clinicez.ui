"use server";

import prisma from "@lib/prisma";
import { isHP } from "@lib/protect-org";
import { HealthConditionStatus, Severity, User } from "@prisma/client";
import { cache } from "react";

export const addUserIllnessAction = async (payload: {
    userId: string;
    illness: string;
    severity: Severity,
    notes?: string,
    dateDiagnosed?: Date,
}) => {
  const { userId, illness, severity, notes, dateDiagnosed} = payload;
  return await prisma.userHealthCondition.create({
    data: {
      severity,
      notes: notes,
      dateDiagnosed,
      User: {
        connect: {
          userId
        },
      },
      HealthCondition: {
        connectOrCreate: {
          where: { name: illness },
          create: { name: illness }
        }
      }
    }
  })
};

export const getUserIllnessesAction = cache(async (userId?: string) => {
  return await prisma.userHealthCondition.findMany({
    orderBy: {
      dateDiagnosed: "desc"
    },
    ...userId && {
      where:{
        User: {
          userId
        }
      }
    },
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,
      dateResolved: true,
      status: true,
      ResolvedBy: {
        select: {
          id: true,
          userId: true,
          picture: true,
          firstName: true,
          lastName: true
        }
      },
      DiagnosedBy: {
        select: {
          id: true,
          userId: true,
          picture: true,
          firstName: true,
          lastName: true
        },
      },
      HealthCondition: {
        select: {
          name: true
        }
      }
    }
  })
})

export const updateUserIllnessAction = async (payload: {
    id: number
    severity: Severity,
    notes?: string,
    dateDiagnosed: Date,
}) => {
  const { id, severity, notes, dateDiagnosed } = payload;
  return await prisma.userHealthCondition.update({
    where: { id },
    data: {
      severity,
      notes,
      dateDiagnosed
    }
  })
}

export const deleteUserIllnessAction = async (id: number) => {
  return await prisma.userHealthCondition.delete({
    where: { id }
  })
}

export const upsertUserIllnessAction = async (payload: {
    id: number,
    userId: string,
    illness: string,
    severity: Severity,
    notes?: string | null,
    dateDiagnosed?: Date,
}) => {
  const { id, userId, illness, severity, notes, dateDiagnosed } = payload;
  return await prisma.userHealthCondition.upsert({
    where: { id },
    create: {
      notes,
      severity,
      dateDiagnosed,
      HealthCondition: { 
        connectOrCreate: {
          where: { name: illness },
          create: { name: illness }
        }
      },
      User: {
        connect: {
          userId
        }
      }
    },
    update: {
      severity,
      notes: "",
      dateDiagnosed,
      HealthCondition: {
        connectOrCreate: {
          where: { name: illness },
          create: { name: illness }
        }
      }
    },
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,
      dateResolved: true,
      status: true,
      HealthCondition: {
        select: {
          name: true
        }
      }
    }
  })
}


type RESOLVED = typeof HealthConditionStatus.RESOLVED
export function setUserIllnessStatusAction(id: number, status: RESOLVED, userId: string): Promise<boolean>;
export function setUserIllnessStatusAction(id: number, status: Exclude<HealthConditionStatus, RESOLVED>): Promise<boolean>;

export async function setUserIllnessStatusAction(id: number, status: HealthConditionStatus, userId?: string): Promise<boolean> {
  const hp = await isHP()
  if(!hp) throw new Error("You are not authorized to perform this action, only healthcare providers can resolve illnesses.")
  await prisma.userHealthCondition.update({
    where: { id },
    data: { 
      status,
      ...status === "RESOLVED" && userId ? {
        dateResolved: new Date(),
        ResolvedBy: {
          connect: {
            userId
          }
        }
      } : {}
    }
  })
  return true
}
