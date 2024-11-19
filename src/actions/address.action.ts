"use server";

import prisma from "@lib/prisma";
import { AddressItemProps } from "@/app/(main)/user/[user]/phr/address/AddressItem";

export const getAddressesAction = async (userId: string) => {
  return await prisma.userAddress.findMany({
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

export const createAddressAction = async (userId: string, data: Omit<AddressItemProps["address"], "id">) => {
  return await prisma.userAddress.create({
    data: {
      ...data,
      User: {
        connect: {
          userId
        }
      },
    }
  });
}


export const updateAddressAction = async (data: AddressItemProps["address"]) => {
  return await prisma.userAddress.update({
    where: {
      isActive: true,
      id: data.id
    },
    data
  });
}

export const deleteAddressAction = async (addressId: number) => {
  return await prisma.userAddress.update({
    where: {
      isActive: true,
      id: addressId
    },
    data: { isActive: false }
  });
}