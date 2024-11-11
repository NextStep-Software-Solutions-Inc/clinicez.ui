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
      VaccineAttribute: {
        select: {
          effectivity: true
        }
      },
      VaccineDoses: {
        select: {
          Dose: {
            select: {
              id: true,
              dose: true,
            }
          }
        }
      },
      VaccineRoutes: {
        select: {
          Route: {
            select: {
              id: true,
              route: true,
            }
          }
        }
      }
    }
  });
}