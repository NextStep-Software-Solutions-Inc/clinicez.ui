"use server";

import prisma from "@lib/prisma";
import { AddressItemProps } from "@/app/(main)/user/[user]/phr/address/AddressItem";

type AddressUpsertData = {
  isPrimary: boolean;
  address: string;
  apartmentUnit: string | null;
  bldgName: string | null;
  addressLine: string | null;
  street: string | null;
  subdivision: string | null;
  barangay: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const mapAddressInput = (data: Omit<AddressItemProps["address"], "id">): AddressUpsertData => ({
  isPrimary: data.isPrimary,
  address: data.fullAddress,
  apartmentUnit: data.apartmentUnit || null,
  bldgName: data.bldgName || null,
  addressLine: data.addressLine || null,
  street: data.street || null,
  subdivision: data.subdivision || null,
  barangay: data.barangay || null,
  city: data.city,
  state: data.state,
  zipCode: data.zipCode,
  country: data.country,
});

export const getAddressesAction = async (userId: string) => {
  return await prisma.userAddress.findMany({
    orderBy: { createdAt: "desc" },
    where: { isActive: true, User: { userId } },
  });
}

export const createAddressAction = async (userId: string, data: Omit<AddressItemProps["address"], "id">) => {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const allowedData = mapAddressInput(data);
  return await prisma.userAddress.create({
    data: {
      ...allowedData,
      User: { connect: { id: currentUser.id } },
    }
  });
}

export const updateAddressAction = async (data: AddressItemProps["address"]) => {
  const { id, ...rest } = data;
  const allowedData = mapAddressInput(rest);
  return await prisma.userAddress.update({
    where: { id },
    data: allowedData
  });
}

export const deleteAddressAction = async (addressId: number) => {
  return await prisma.userAddress.update({
    where: { id: addressId },
    data: { isActive: false }
  });
}