"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetPatientConfirmedAppointments = Awaited<
  ReturnType<typeof getPatientConfirmedAppointmentsAction>
>;

/**
 * Returns the active/open appointments for a given patient at a given clinic.
 * Includes appointments in PENDING, RECEIVED, ROUTED, CONFIRMED, or RESCHEDULED
 * status — i.e. any appointment that has not been completed, cancelled, or rejected.
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
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const appointments = await prisma.appointment.findMany({
      where: {
        isActive: true,
        Clinic: { clinicUid },
        Requesters: {
          some: { User: { userId: patientUserId } },
        },
        AppointmentAttribute: {
          status: { in: ["PENDING", "RECEIVED", "ROUTED", "CONFIRMED", "RESCHEDULED"] },
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
            status: true,
            date: true,
            timeStart: true,
            AppointmentType: { select: { name: true } },
          },
        },
        AppointmentRouting: {
          select: {
            status: true,
            RoutedTo: {
              select: {
                id: true,
                HPProfile: {
                  select: {
                    title: true,
                    name: true,
                    suffix: true,
                  },
                },
                HPType: {
                  select: {
                    name: true,
                  },
                },
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { message: "Patient appointments fetched", data: appointments };
  }
);
