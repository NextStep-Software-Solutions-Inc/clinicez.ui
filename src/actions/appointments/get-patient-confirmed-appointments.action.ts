"use server";

import prisma from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetPatientConfirmedAppointments = Awaited<
  ReturnType<typeof getPatientConfirmedAppointmentsAction>
>;

/**
 * Returns the CONFIRMED appointments for a given patient at a given clinic.
 * Used by the new-consultation dialog when the HP wants to link to an existing appointment.
 */
export const getPatientConfirmedAppointmentsAction = withErrorHandling(
  async ({
    clinicUid,
    patientUserId,
  }: {
    clinicUid: string;
    patientUserId: string;
  }) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        isActive: true,
        Clinic: { clinicUid },
        Requesters: {
          some: { User: { userId: patientUserId } },
        },
        AppointmentAttribute: {
          status: "CONFIRMED",
        },
      },
      orderBy: [
        { AppointmentAttribute: { date: "desc" } },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        subject: true,
        complaint: true,
        AppointmentAttribute: {
          select: {
            date: true,
            timeStart: true,
            AppointmentType: { select: { name: true } },
          },
        },
      },
    });

    return appointments;
  }
);
