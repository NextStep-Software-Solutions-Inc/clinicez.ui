"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';
import prismaTenant from '@lib/prisma-tenant';
import { Prisma } from "@prisma/tenant/client"
import { hasCodeProperty } from '@lib/utils';

export const assignAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  const response = {
    status: false,
    message: 'Unauthorized'
  }
  if(!session) return response;

  try {
    const routedTo = formData.get('routedTo') as string;
    const routedToRole = formData.get('routedToRole') as string;
    const appointmentId = parseInt(formData.get('appointmentId') as string);

    if(!routedTo || !appointmentId) {
      return {
        status: false,
        message: 'Invalid data provided'
      }
    }
    await prismaTenant.$transaction(async (prisma) => {
      await prisma.appointmentRouting.create({
        data: {
          routedBy: session.user.sub,
          routedTo,
          routedToRole,
          appointmentId,
        }
      })
    
      await prisma.appointmentAttribute.update({
        where: { appointmentId },
        data: { status: 'ROUTED' }
      })

    },
    {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })
    return {
      status: true,
      message: 'Appointment assigned'
    };
  } catch (error) {
    console.error(error);
    let errorMsg = 'Failed to assign appointment';
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMsg = 'Appointment not found or you are not authorized to assign it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}

export const acceptAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };
  const routingCode = formData.get('routingCode') as string;
  try {
    await prismaTenant.appointmentRouting.update({
      where: { 
        routingCode
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
  const reason = formData.get('reason') as string;
  const routingCode = formData.get('routingCode') as string;
  
  try {
    await prismaTenant.appointmentRouting.update({
      where: { 
        routingCode 
      },
      data: { 
        status: 'DECLINED',
        amendedAt: new Date(),
        amendedBy: session.user.sub,
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

export const cancelAppointmentRoutingAction = async (appointmentRoutingId: number) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };

  try {
    await prismaTenant.appointmentRouting.update({
      where: { 
        id: appointmentRoutingId,
        routedBy: session.user.sub,
        status: {
          in: ["PENDING"]
        }
      },
      data: { 
        status: 'CANCELLED',
        amendedBy: session.user.sub,
        amendedAt: new Date(),
        amendment: 'Cancelled by the assigner'
      },
    })
    return {
      status: true,
      message: 'Appointment cancelled'
    };
  } catch (error) {
    let errorMsg = 'Failed to cancel appointment assignment';
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to cancel it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}