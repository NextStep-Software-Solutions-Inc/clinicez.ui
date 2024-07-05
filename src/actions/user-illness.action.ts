"use server";

import prisma from "@lib/prisma";
import { Severity } from "@prisma/client";
import { cache } from "react";

export const addUserIllnessAction = async (payload: {
    userId: string;
    illness: string;
    severity: Severity,
    notes?: string,
    dateDiagnosed?: Date
}) => {
  const { userId, illness, severity, notes, dateDiagnosed } = payload;
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

export const getUserIllnessesAction = cache(async (userId: string) => {
  return await prisma.userHealthCondition.findMany({
    orderBy: {
      dateDiagnosed: "desc"
    },
    where:{
      User: {
        userId
      }
    },
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,
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
    dateDiagnosed: Date
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
    dateDiagnosed?: Date
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
      severity: "MILD",
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
      HealthCondition: {
        select: {
          name: true
        }
      }
    }
  })
}