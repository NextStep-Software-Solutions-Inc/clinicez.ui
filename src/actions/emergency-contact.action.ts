"use server";

import prisma from "@lib/prisma";

export async function getEmergencyContactsAction(userId: string) {
  return await prisma.userEmergencyContact.findMany({
    orderBy: {
      createdAt: "desc"
    },
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
  firstName: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  address: string | null;
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
  address: string | null;
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

export const setPrimaryEmergencyContactAction = async (userId: string, contactId: number) => {
  // First, set all contacts for this user to non-primary
  await prisma.userEmergencyContact.updateMany({
    where: {
      User: {
        userId,
      },
      isActive: true,
    },
    data: {
      isPrimary: false,
    },
  })

  // Then set the selected contact as primary
  return await prisma.userEmergencyContact.update({
    where: {
      id: contactId,
      isActive: true,
    },
    data: {
      isPrimary: true,
    },
  })
}

export const upsertEmergencyContactAction = async (userId: string, data: {
  id: number;
  firstName: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  address: string | null;
}) => {

  const res = await prisma.userEmergencyContact.upsert({
    where: {
      id: data.id,
    },
    create: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      suffix: data.suffix,
      phone: data.phone,
      name: data.name,
      isPrimary: data.isPrimary,
      relationship: data.relationship,
      address: data.address,
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