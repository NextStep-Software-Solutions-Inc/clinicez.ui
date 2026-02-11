"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "@actions/session.action";

export type GetClinicSetting = Awaited<ReturnType<typeof getClinicSettingAction>>
export const getClinicSettingAction = cache(async (clinicUid: string) => {

  let message = "Clinic settings fetched successfully";

  try {
    const clinicSetting = await prisma.clinicSetting.findFirst({
      where: { Clinic: { clinicUid } },
      include: {
        Clinic: {
          select: {
            AppointmentConfig: true,
            ConsultationConfig: true,
            updatedAt: true
          }
        }
      }
    });
    return { status: true, message, data: clinicSetting  }
  } catch (error) {
    console.error(error);
    message = "Error while fetching clinic settings";
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === 'P2025') message = "Clinic not found";
    return { status: false, message, data: null }
  }
});

type UpsertClinicSetting = {
  enableAppointment?: boolean;
  enableConsultation?: boolean;
  clinicUid: string;
}
export const updateClinicSettingsAction = async (clinicSettingId: number, { enableAppointment, enableConsultation, clinicUid }: UpsertClinicSetting) => {

  let message = "Clinic settings updated successfully";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    const clinicSetting = await prisma.clinicSetting.update({
      where: { 
        id: clinicSettingId
      },
      data: {
        Clinic: {
          update: {
            AppointmentConfig: {
              upsert: {
                where: {
                  Clinic: {
                    clinicUid
                  }
                },
                create: { },
                update: { }
              }
            }
          }
        },
        enableAppointment,
        enableConsultation,
      },
      include: {
        Clinic: {
          select: {
            AppointmentConfig: true,
            ConsultationConfig: true
          }
        }
      }
    });
    return { status: true, message, data: clinicSetting }
  } catch (error) {
    console.error(`Error updating clinic settings: ${error}`);
    message = "Failed to update clinic settings";
    if(error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  }
};

type UpdatePhilHealthSettings = {
  philhealthAccreditationNumber?: string;
  facilityName?: string;
}
export const updatePhilHealthSettingsAction = async (clinicUid: string, data: UpdatePhilHealthSettings) => {

  let message = "PhilHealth settings updated successfully";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    // Get the clinic first to ensure it exists and user has access
    const clinic = await prisma.clinic.findFirst({
      where: { clinicUid, isActive: true }
    });

    if (!clinic) {
      throw new Error("Clinic not found or unauthorized.");
    }

    // Upsert clinic setting - create if doesn't exist, update if it does
    const clinicSetting = await prisma.clinicSetting.upsert({
      where: { 
        clinicId: clinic.id
      },
      create: {
        clinicId: clinic.id,
        philhealthAccreditationNumber: data.philhealthAccreditationNumber,
        facilityName: data.facilityName,
      },
      update: {
        philhealthAccreditationNumber: data.philhealthAccreditationNumber,
        facilityName: data.facilityName,
      }
    });
    return { status: true, message, data: clinicSetting }
  } catch (error) {
    console.error(`Error updating PhilHealth settings: ${error}`);
    message = "Failed to update PhilHealth settings";
    if(error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  }
};