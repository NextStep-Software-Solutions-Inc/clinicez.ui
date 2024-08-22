"use server";

import prisma from "@lib/prisma-tenant";
import { cache } from "react";

export type GetAppointmentTypes = Awaited<ReturnType<typeof getAppointmentTypesAction>>;
export const getAppointmentTypesAction = cache(async (orgUid: string) => {
  return await prisma.appointmentType.findMany({
    where: {
      orgUid,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      AppointmentTypeAttribute: {
        select: {
          id: true,
          duration: true,
          durationPadding: true
        }
      }
    }
  });
})