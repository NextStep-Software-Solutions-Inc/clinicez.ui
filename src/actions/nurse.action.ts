import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";

export const getNursesAction = async () => {
  const nurses = await prisma.nurseProfile.findMany({
    where: {
      isActive: true
    },
    
  })
  return nurses;
}

export const getNurseAction = async (hpId: number) => {
  const nurse = await prisma.nurseProfile.findUnique({
    where: {
      isActive: true,
      healthcareProviderId: hpId
    },
    include: {
      HealthcareProvider: {
        include: {
          User: {
            include: {
              SocialLink: true
            }
          }
        }
      }
    }
  })
  return nurse;
}


export const createNurseAction = async (nurse: Prisma.NurseProfileCreateArgs["data"]) => {
  const newNurse = await prisma.nurseProfile.create({
    data: {
      ...nurse
    }
  })
  return newNurse;
}