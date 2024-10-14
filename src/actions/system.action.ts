"use server";

import prismaTenant from "@lib/prisma-tenant";
import { cache } from "react";

export type GetSystems = Awaited<ReturnType<typeof getSystemsAction>>;
export const getSystemsAction = cache(async (orgUid?:string) => {
  return await prismaTenant.system.findMany({
    where: { 
      isActive: true,
      ...orgUid? {orgUid} : {}
    },
    select: {
      id: true,
      name: true,
    }
  });
});

type CreateSystemPayload = {
  name: string;
  orgUid: string;
}
export const createSystemAction = async (payload: CreateSystemPayload) => {
  const { name, orgUid } = payload;
  try {
    await prismaTenant.system.create({
      data: {
        orgUid,
        name
      }
    });
    return { status: true, message: "System created successfully" }
  } catch (error) {
    console.error(`Failed to create system: ${error}`);
    let message = "Failed to create system";
    if(error instanceof Error) message = error.message;
    return { status: false, message }    
  }
}

type UpdateSystemPayload = {
  id: number;
  name: string;
}
export const updateSystemAction = async (payload: UpdateSystemPayload) => {
  const { id, name } = payload;
  try {
    await prismaTenant.system.update({
      where: { id, isActive: true },
      data: { name }
    });
    return { status: true, message: "System updated successfully" }
  } catch (error) {
    console.error(`Failed to update system: ${error}`);
    let message = "Failed to update system";
    if(error instanceof Error) message = error.message;
    return { status: false, message }    
  }
}

export const deleteSystemAction = async (id: number) => {
  try {
    await prismaTenant.system.update({
      where: { id, isActive: true },
      data: { isActive: false }
    });
    return { status: true, message: "System deleted successfully" }
  } catch (error) {
    console.error(`Failed to delete system: ${error}`);
    let message = "Failed to delete system";
    if(error instanceof Error) message = error.message;
    return { status: false, message }    
  }
}