"use server";

import prisma from "@lib/prisma-tenant";
import { cache } from "react";

export type GetAppointmentModes = Awaited<ReturnType<typeof getAppointmentModesAction>>;
export const getAppointmentModesAction = cache(async (orgUid: string) => {
  return await prisma.appointmentMode.findMany({
    where: {
      orgUid,
      isActive: true
    }
  });
})