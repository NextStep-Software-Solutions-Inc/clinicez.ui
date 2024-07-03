"use server";

import prisma from "@lib/prisma";   


export const getVaccinesAction = async () => {
  return await prisma.vaccine.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      VaccineDoses: {
        select: {
          id: true,
          dose: true
        }
      },
      VaccineRoutes: {
        select: {
          id: true,
          route: true
        }
      },
      VaccineAttritube: {
        select: {
          effectivity: true
        }
      }
    }
  });
}