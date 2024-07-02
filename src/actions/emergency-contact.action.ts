"use server";

import prisma from "@lib/prisma";

export async function getEmergencyContactsAction(userId: string) {
  return await prisma.userEmergencyContact.findMany({
    where: {
      isActive: true,
      User: {
        userId
      }
    },
  });
}

export async function getEmergencyContactAction(emergencyContactId: number) {
  return await prisma.userEmergencyContact.findFirst({
    where: {
      isActive: true,
      id: emergencyContactId,
    },
  });
}


export async function createEmergencyContactAction(userId: string, data: {
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
}) {
  return await prisma.userEmergencyContact.create({
    data: {
      ...data,
      User: {
        connect: {
          userId,
        },
      }
    },
  });
}


export async function updateEmergencyContactAction(emergencyContactId: number, data: {
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
}) {
  return await prisma.userEmergencyContact.update({
    where: {
      isActive: true,
      id: emergencyContactId,
    },
    data: { ...data }
  });
}

export const deleteEmergencyContactAction = async (emergencyContactId: number) => {
  return await prisma.userEmergencyContact.update({
    where: {
      id: emergencyContactId,
    },
    data: {
      isActive: false,
    },
  });
}

export const upsertEmergencyContactAction = async (userId: string, data: {
    id: number;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
}) => {
  
  const res = await prisma.userEmergencyContact.upsert({
    where: {
      id: data.id,
    },
    create: {
      phone: data.phone,
      name: data.name,
      isPrimary: data.isPrimary,
      relationship: data.relationship,
      User: {
        connect: {
          userId,
        },
      },
    },
    update: {
      ...data,
    },
  });
  return res;
}