"use server";

import prisma from "@lib/prisma-common";
import { cache } from "react";

export const createUserAllergyAction = async (payload: {
    userId: string,
    allergen: string,
    reaction: string,
    notes?: string | null
}) => {
  const { userId, allergen, reaction, notes } = payload;
  return await prisma.userAllergy.create({
    data: {
      User: {
        connect: {
          userId
        }
      },
      Allergen: {
        connectOrCreate: {
          where: { name: allergen },
          create: {
            name: allergen
          }
        }
      },
      reaction,
      notes
    }
  });
}


export type GetUserAllergies = Awaited<ReturnType<typeof getUserAllergiesAction>>
export const getUserAllergiesAction = cache(async (userId: string) => {
  return await prisma.userAllergy.findMany({
    where: { 
      User: {
        userId
      }
    },
    select: {
      id: true,
      Allergen: {
        select: {
          name: true
        }
      },
      reaction: true,
      notes: true
    }
  });
});


export const updateUserAllergyAction = async (payload: {
    id: number
    allergenId?: number,
    reaction?: string,
    notes?: string | null
}) => {
  const { allergenId, reaction, notes, id } = payload;
  return await prisma.userAllergy.update({
    where: {id},
    data: {
      allergenId,
      reaction,
      notes
    }
  });
}


export const deleteUserAllergyAction = async (id: number) => {
  return await prisma.userAllergy.delete({
    where: {id}
  });
}

export const upsertUserAllergyAction = async (payload: {
  id: number,
  allergen: string,
  reaction: string,
  notes?: string | null,
  userId: string
} ) => {
  const {id, userId, notes, reaction, allergen } = payload;
  return await prisma.userAllergy.upsert({
    where: { id },
    create: {
      notes: notes,
      reaction: reaction,
      Allergen: {
        connectOrCreate: {
          where: { name: allergen },
          create: { name: allergen }
        }
      },
      User: {
        connect: { userId }
      }
    },
    update: {
      notes: notes,
      reaction: reaction,
      Allergen: {
        connectOrCreate: {
          where: { name: allergen },
          create: {
            name: allergen
          }
        }
      },
      User: {
        connect: { userId }
      }
    },
    select: {
      id: true,
      Allergen: {
        select: {
          id: true,
          name: true
        }
      },
      reaction: true,
      notes: true
    }
  });
}