"use server";

import { getCachedSession } from "../session.action"
import prisma from "@lib/prisma";

export const getPhilHealthMemberTypesAction = async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const memberTypes = await prisma.philHealthMemberType.findMany();
  return memberTypes;
}