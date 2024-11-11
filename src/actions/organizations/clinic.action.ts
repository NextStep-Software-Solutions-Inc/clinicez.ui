"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { ClinicMemberStatus } from "@/types";
import { getCachedSession } from "@actions/session.action";


type CreateClinicPayload = {
  clinicUid: string;
  tenantUid: string;
  name: string;
  logo?: string;
}
export const createClinicAction = async (data:CreateClinicPayload) => {

  const { clinicUid, tenantUid, name, logo } = data;
  const newOrganization = await prisma.clinic.create({
    data: { 
      Tenant: {
        connect: {
          tenantUid
        }
      },
      clinicUid,
      name,
      logo
    }
  });
  
  return newOrganization;
};
  

type FiltersType = {
  userId?: string;
  clinicUid?: string;
  status?: ClinicMemberStatus;
}

export type GetClinics = Awaited<ReturnType<typeof getClinicsAction>>
export const getClinicsAction = cache(async (filters?: FiltersType) => {

  const { userId, clinicUid } = filters || {};
  const clinics = await prisma.clinic.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      clinicUid,
      ...(userId && {
        Users: {
          every: {
            User: {
              userId
            }
          }
        }
      }),
      isActive: true
    }
  });
  return clinics;
});

export type GetClinic = Awaited<ReturnType<typeof getClinicAction>>
export const getClinicAction = cache(async (key: string | number) => {

  const clinic = await prisma.clinic.findFirst({
    where: {
      isActive: true,
      OR: [
        {...!isNaN(Number(key))? {id: Number(key)} : {}}, 
        {clinicUid: String(key)}
      ]
    },
    include: {
      Tenant: {
        select: {
          id: true,
          tenantUid: true
        }
      },
      ClinicSetting: true,
    }
  });
  return clinic;
})

type UpdateClinicPayload = {
  name: string;
  description?: string;
  logo: string;
  customUrl?: string;
  email: string;
  isPublic: boolean;
  sendEmailNotification: boolean;
  emailToClinicOnly: boolean;
  enableAppointment: boolean;
  enableConsultation: boolean;
}
export const updateClinicAction = async (clinicUid: string, data: UpdateClinicPayload) => {

  let message = "Clinic updated successfully";

  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const {name, logo, description, customUrl, email, isPublic, sendEmailNotification, emailToClinicOnly, enableAppointment, enableConsultation} = data;
    const clinic = await prisma.clinic.update({
      where: { clinicUid, isActive: true },
      data: {
        name,
        description,
        logo,
        customUrl,
        email,
        ClinicSetting: {
          upsert: {
            where:{
              Clinic: {
                clinicUid
              }
            },
            create: {
              isPublic,
              sendEmailNotification,
              emailToClinicOnly,
              enableAppointment,
              enableConsultation,
            },
            update: {
              isPublic: data.isPublic,
              sendEmailNotification,
              emailToClinicOnly,
              enableAppointment,
              enableConsultation,
            }
          }
        }
      },
      include: {
        ClinicSetting: true,
      }
    });
    return { status: true, message, data: clinic };
  } catch (error) {
    console.error("Error updating clinic", error);
    message = "Error updating clinic";
    if(error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  }
}