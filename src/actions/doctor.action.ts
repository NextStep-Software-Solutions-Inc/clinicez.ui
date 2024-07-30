"use server";

import prisma from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";

export const getDoctorsAction = async () => {
  const doctors = await prisma.doctorProfile.findMany({
    where: {
      isActive: true,
      HealthcareProvider: {
        isPublished: true
      }
    },
    
  })
  return doctors;
}

export const getDoctorAction = async (hpId: number) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: {
      isActive: true,
      healthcareProviderId: hpId
    },
    include: {
      HealthcareProvider: {
        select: {
          isPublished: true,
          User: {
            select: {
              userId: true,
              SocialLink: true,
            }
          }
        }
      }
    }
  })
  return doctor;
}


export const createDoctorAction = async (doctor: Prisma.DoctorProfileCreateArgs["data"]) => {
  const newDoctor = await prisma.doctorProfile.create({
    data: {
      ...doctor
    }
  })
  return newDoctor;
}
export const upsertDoctorAction = async (payload: Prisma.DoctorProfileUpsertArgs) => {
  const newDoctor = await prisma.doctorProfile.upsert(payload)
  return newDoctor;
}