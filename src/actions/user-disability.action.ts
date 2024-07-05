"use server";

import prisma from "@lib/prisma";
import { Severity } from "@prisma/client";
import { cache } from "react";

export const addUserDisabilityAction = async (payload: {
    userId: string;
    disability: string;
    severity: Severity,
    notes?: string | null,
    dateDiagnosed: Date
}) => {
  const { userId, disability, severity, notes, dateDiagnosed } = payload;
  return await prisma.userDisability.create({
    data: {
      severity,
      notes: notes,
      dateDiagnosed,
      User: {
        connect: {
          userId
        },
      },
      Disability: {
        connectOrCreate: {
          where: { name: disability },
          create: { name: disability }
        }
      }
    }
  })
};

export const getUserDisabilitiesAction = cache(async (userId: string) => {
  return await prisma.userDisability.findMany({
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
      Disability: {
        select: {
          name: true
        }
      }
    }
  })
})

export const updateUserDisabilityAction = async (payload: {
    id: number
    severity: Severity,
    notes?: string | null,
    dateDiagnosed: Date
}) => {
  const { id, severity, notes, dateDiagnosed } = payload;
  return await prisma.userDisability.update({
    where: { id },
    data: {
      severity,
      notes,
      dateDiagnosed
    }
  })
}

export const deleteUserDisabilityAction = async (id: number) => {
  return await prisma.userDisability.delete({
    where: { id }
  })
}

export const upsertUserDisabilityAction = async (payload: {
    id: number,
    userId: string,
    disability: string,
    severity: Severity,
    notes?: string | null,
    dateDiagnosed?: Date
}) => {
  const { id, userId, disability, severity, notes, dateDiagnosed } = payload;
  
  return await prisma.userDisability.upsert({
    where: { id },
    create: {
      notes,
      severity,
      dateDiagnosed,
      Disability: {
        connectOrCreate: {
          where: { name: disability },
          create: { name: disability }
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
      Disability: {
        connectOrCreate: {
          where: { name: disability },
          create: { name: disability }
        }
      }
    },
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,
      Disability: {
        select: {
          name: true
        }
      }
    }
  })
}