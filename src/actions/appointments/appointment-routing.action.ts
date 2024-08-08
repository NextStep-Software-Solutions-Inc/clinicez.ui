"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';

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
      where: {
        id: appointmentId
      },
      data: {
        status: 'ROUTED'
      }
    })
  })

  return {
    status: true,
    message: 'Appointment assigned'
  };
}