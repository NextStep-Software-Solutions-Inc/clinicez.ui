"use server";

import "server-only";
import prismaClient from "@/lib/prisma";


export const getOrganizationClinics = async (orgUid: string) => {

  const clinics = await prismaClient.clinicOrganization.findMany({
    where: {
      Organization: {
        orgUid
      }
    },
    select: {
      Clinic: {
        select: {
          id: true,
          clinicUid: true,
          name: true,
          logo: true,
        }
      }
    }
  });
}