"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';
import prismaTenant from '@lib/prisma-tenant';

export const receiveAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  const response = {
    status: false,
    message: 'Unauthorized'
  }
  if(!session) return response;
  
  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const newStatus = formData.get('status') as string;
  await prismaTenant.appointmentAttribute.update({
    where: {
      appointmentId
    },
    data: {
      status: newStatus,
      receivedAt: new Date(),
      receivedBy: session.user.sub
    }
  })
  return {
    status: true,
    message: 'Appointment received'
  };
}

export const completeAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  const response = {
    status: false,
    message: 'Unauthorized'
  }
  if(!session) return response;
  
  const appointmentId = parseInt(formData.get('appointmentId') as string);
  await prismaTenant.appointmentAttribute.update({
    where: {
      appointmentId
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedBy: session.user.sub
    }
  })
  return {
    status: true,
    message: 'Appointment completed'
  };
}

export const rejectAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  const response = {
    status: false,
    message: 'Unauthorized'
  }
  if(!session) return response;
  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const reason = formData.get('reason') as string;
  
  await prismaTenant.appointmentAttribute.update({
    where: {
      appointmentId,
    },
    data: {
      status: "REJECTED",
      rejectedReason: reason,
      rejectedAt: new Date(),
      rejectedBy: session.user.sub
    }
  })
  return {
    status: true,
    message: 'Appointment rejected'
  };
}