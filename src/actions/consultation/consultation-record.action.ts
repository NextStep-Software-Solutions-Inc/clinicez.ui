"use server";

import prismaTenant from '@lib/prisma-tenant';
import { getCachedSession } from '@actions/session.action';
import 'server-only'

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

  await prismaTenant.consultationRecord.create({
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
    data: null
  }
}

export type GetConsultationRecord = Awaited<ReturnType<typeof getConsultationRecordAction>>;
export const getConsultationRecordAction = async (appointmentId: number) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  const consultationRecord = await prismaTenant.consultationRecord.findMany({
    where: {
      appointmentId
    }
  })
  return {
    status: true,
    message: "Consultation record fetched successfully",
    data: consultationRecord
  }
}