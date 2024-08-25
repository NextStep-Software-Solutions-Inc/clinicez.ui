"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';
import prismaTenant from '@lib/prisma-tenant';
import { hasCodeProperty } from '@lib/utils';

export const assignAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  const response = {
    status: false,
    message: 'Unauthorized'
  }
  if(!session) return response;

  const routedTo = formData.get('routedTo') as string;
  const appointmentId = parseInt(formData.get('appointmentId') as string);

  await prismaTenant.$transaction(async (prisma) => {
    await prisma.appointmentRouting.create({
      data: {
        routedBy: session.user.email,
        routedTo,
        appointmentId,
      }
    })
    await prisma.appointmentAttribute.update({
      where: { id: appointmentId },
      data: { status: 'ROUTED' }
    })
  })

  return {
    status: true,
    message: 'Appointment assigned'
  };
}

export const acceptAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };
  const appointmentId = parseInt(formData.get('appointmentId') as string);

  try {
    await prismaTenant.appointmentRouting.update({
      where: { 
        unique_appointment_routing: {
          appointmentId,
          routedTo: session.user.email
        } 
      },
      data: { status: 'ACCEPTED'},
    })
    return {
      status: true,
      message: 'Appointment accepted'
    };
  } catch (error) {
    let errorMsg = 'Failed to accept appointment assignment';
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to accept it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}

export const declineAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };
  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const reason = formData.get('reason') as string;

  try {
    await prismaTenant.appointmentRouting.update({
      where: { 
        unique_appointment_routing: {
          appointmentId,
          routedTo: session.user.email
        } 
      },
      data: { 
        status: 'DECLINED',
        amendedAt: new Date(),
        amendedBy: session.user.email,
        amendment: reason
      },
    })
    return {
      status: true,
      message: 'Appointment declined'
    };
  } catch (error) {
    let errorMsg = 'Failed to decline appointment assignment';
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to decline it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}
