"use server";
import 'server-only'

import prismaTenant from '@lib/prisma-tenant';
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';
import { getCachedSession } from '@actions/session.action';
import { cache } from 'react';

type CreateConsultationRecordPayload = {
    appointmentId: number;
    subject: string;
    orgUid: string;
}

export const createConsultationRecordAction = async ({appointmentId, orgUid, subject}: CreateConsultationRecordPayload) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  const consultationRecord = await prismaTenant.consultationRecord.create({
    data: {
      appointmentId,
      subject,
      orgUid,
      createdBy: session.user.email,
      ConsultationRecordAttribute:{
        create: {
        }
      }
    }
  })
  return {
    status: true,
    message: "Consultation Record created successfully",
    data: consultationRecord
  }
}

export type GetConsultationRecord = Awaited<ReturnType<typeof getConsultationRecordAction>>;
export const getConsultationRecordAction = cache(async (consultationId: number, orgUid: string) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }


  const consultationRecord = await prismaTenant.consultationRecord.findUnique({
    where: { id: consultationId, orgUid },
    select: {
      id: true,
      subject: true,
      appointmentId: true,
      orgUid: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      ConsultationRecordAttribute: {
        select: {
          noteTemplateName: true,
          status: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              email: true
            }
          },
          AppointmentAttribute: {
            select: {
              AppointmentMode: {
                select: {
                  id: true,
                  name: true
                }
              },
              AppointmentType: {
                select: {
                  id: true,
                  name: true
                }
              },
              Service: {
                select: {
                  id: true,
                  name: true
                }
              },
            }
          }
        }
      }
    }
  })

  return {
    status: true,
    message: "Consultation record fetched successfully",
    data: consultationRecord
  }
})

export type GetConsultationRecords = Awaited<ReturnType<typeof getConsultationRecordsAction>>;
export const getConsultationRecordsAction = async ({orgUid}: {orgUid: string}) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: []
  }

  const consultationRecords = await prismaTenant.consultationRecord.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      orgUid,
      OR: [
        { createdBy: session.user.email },
        { Appointment: { Requesters: { some: { email: session.user.email } } } }
      ]
    },
    select: {
      id: true,
      subject: true,
      appointmentId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      ConsultationRecordAttribute: {
        select: {
          noteTemplateName: true,
          status: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              email: true
            }
          },
          AppointmentAttribute: {
            select: {
              AppointmentMode: {
                select: {
                  id: true,
                  name: true
                }
              },
              AppointmentType: {
                select: {
                  id: true,
                  name: true
                }
              },
              Service: {
                select: {
                  id: true,
                  name: true
                }
              },
            }
          }
        }
      }
    }
  })
  return {
    status: true,
    message: "Consultation records fetched successfully",
    data: consultationRecords
  }
}

type UpdateConsultationRecordPayload = {
  consultationId: number;
  subject: string;
}
export const updateConsultationRecordAction = async ({consultationId, subject}: UpdateConsultationRecordPayload) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationRecord.update({
      where: { id: consultationId, createdBy: session.user.email },
      data: { subject }
    })
    return {
      status: true,
      message: "Consultation Record updated successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to update consultation record"
    if(error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      message = error.meta?.cause as string ?? message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}


export const deleteConsultationRecordAction = async (consultationId: number) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationRecord.update({
      where: { id: consultationId, createdBy: session.user.email },
      data: {
        isActive: false
      }
    })
    return {
      status: true,
      message: "Consultation Record deleted successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to delete consultation record"
    if(error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      message = error.meta?.cause as string ?? message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}