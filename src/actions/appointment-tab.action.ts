"use server";

import prisma from "@lib/prisma-common";

export type GetAppointmentTabs = Awaited<ReturnType<typeof getAppointmentTabsAction>>
export const getAppointmentTabsAction = async () => {
  const appointmentTabs = await prisma.appointmentTab.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      description: true,
    }
    
  });
    
  return appointmentTabs;
}