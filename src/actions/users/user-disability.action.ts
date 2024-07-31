import { GetUser } from './user.action';
"use server";

import prisma from "@lib/prisma-common";
import { Severity } from "@prisma/common/client";
import { cache } from "react";

export const addUserDisabilityAction = async (payload: {
    userId: string;
    disability: string;
    severity: Severity,
    notes?: string | null,
    isManaged?: boolean,
    dateDiagnosed: Date
}) => {
  const { userId, disability, severity, notes, dateDiagnosed, isManaged } = payload;
  return await prisma.userDisability.create({
    data: {
      severity,
      notes: notes,
      dateDiagnosed,
      ...isManaged ? { isManage: true } : {},
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


export type GetUserDisabilities = Awaited<ReturnType<typeof getUserDisabilitiesAction>>
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
      
      isManaged: true,
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
    isManaged?: boolean,
    dateDiagnosed?: Date
}) => {
  const { id, userId, disability, severity, notes, dateDiagnosed, isManaged } = payload;
  
  return await prisma.userDisability.upsert({
    where: { id },
    create: {
      notes,
      severity,
      dateDiagnosed,
      ...isManaged ? { isManaged: true } : {},
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
      ...isManaged ? { isManaged: true } : {},
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

export const setIsManagedAction = async (id: number, isManaged: boolean) => {
  return await prisma.userDisability.update({
    where: { id },
    data: {
      isManaged
    }
  })
}