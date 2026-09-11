"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { hasClinicPermissionAction } from "@/actions/permission.action";
import { PERMISSIONS } from "@/lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";

/**
 * Access levels for the patient history page.
 * - "owner"  : the patient themselves
 * - "staff"  : healthcare provider / clinic member with explicit permission
 */
export type PatientHistoryAccess = "owner" | "staff";

/**
 * Check whether the current user may view the combined appointments +
 * consultations history for the given patient at the given clinic.
 *
 * Allowed:
 *  1. The patient (owner) – current user's Auth0 sub matches the patient's userId.
 *  2. A clinic member (HP or staff) with the
 *     READ:CLINIC:CONSULTATION_TICKET:ALL explicit clinic permission.
 *
 * Returns the access level, or null when the user is not authorised.
 */
export async function checkPatientHistoryAccessAction(
  clinicUid: string,
  numericPatientId: number
): Promise<PatientHistoryAccess | null> {
  const session = await getCachedSession();
  if (!session?.user?.sub) return null;

  const userId = session.user.sub;

  // Resolve whether the requesting user is the patient themselves
  const patientUser = await prisma.user.findUnique({
    where: { id: numericPatientId },
    select: { userId: true },
  });

  if (!patientUser) return null;

  if (patientUser.userId === userId) return "owner";

  // Not the owner – check explicit clinic permission
  const hasPermission = await hasClinicPermissionAction({
    userId,
    clinicUid,
    permissionName: PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:ALL"].name,
  });

  return hasPermission ? "staff" : null;
}

// ---------------------------------------------------------------------------
// Action to fetch the combined history data
// ---------------------------------------------------------------------------

export type GetPatientHistoryResult = Awaited<
  ReturnType<typeof getPatientHistoryAction>
>;

export const getPatientHistoryAction = withErrorHandling(
  async ({
    clinicUid,
    numericPatientId,
    access,
  }: {
    clinicUid: string;
    numericPatientId: number;
    access: PatientHistoryAccess;
  }) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    // ------------------------------------------------------------------
    // Resolve the patient's userId for querying appointment requesters
    // ------------------------------------------------------------------
    const patientUser = await prisma.user.findUnique({
      where: { id: numericPatientId },
      select: {
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        picture: true,
        gender: true,
        dob: true,
      },
    });

    if (!patientUser) throw new Error("Patient not found");

    const patientUserId = patientUser.userId;

    // ------------------------------------------------------------------
    // Fetch all appointments for this patient at this clinic
    // ------------------------------------------------------------------
    const appointments = await prisma.appointment.findMany({
      where: {
        isActive: true,
        Clinic: { clinicUid },
        Requesters: {
          some: { User: { userId: patientUserId } },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        complaint: true,
        createdAt: true,
        updatedAt: true,
        AppointmentAttribute: {
          select: {
            status: true,
            date: true,
            timeStart: true,
            timeEnd: true,
            AppointmentType: { select: { name: true } },
            AppointmentMode: { select: { name: true } },
            Service: { select: { name: true } },
          },
        },
        AppointmentRouting: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            RoutedTo: {
              select: {
                HPProfile: { select: { title: true, name: true, suffix: true } },
                User: { select: { firstName: true, lastName: true } },
                HPType: { select: { name: true } },
              },
            },
          },
        },
        ConsultationTickets: {
          where: { isActive: true },
          take: 1,
          select: { id: true, caseNumber: true },
        },
        PreAssessmentNotes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            assessment: true,
            homeInstructions: true,
            remarks: true,
          },
        },
      },
    });

    // ------------------------------------------------------------------
    // Fetch all consultation tickets for this patient at this clinic
    // ------------------------------------------------------------------
    const consultationTickets = await prisma.consultationTicket.findMany({
      where: {
        isActive: true,
        Clinic: { clinicUid },
        OR: [
          {
            Appointment: {
              Requesters: {
                some: { User: { userId: patientUserId } },
              },
            },
          },
          {
            ClinicPatient: {
              Patient: { userId: patientUserId },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
        isArchived: true,
        caseNumber: true,
        ConsultationTicketAttribute: {
          select: {
            status: true,
            NoteTemplate: {
              select: {
                NoteSections: {
                  where: { isActive: true },
                  select: { id: true, name: true, label: true },
                },
              },
            },
          },
        },
        ConsultationTicketHPs: {
          select: {
            HealthCareProvider: {
              select: {
                id: true,
                HPProfile: {
                  select: { title: true, name: true, suffix: true },
                },
                User: { select: { firstName: true, lastName: true } },
                HPType: { select: { name: true } },
              },
            },
          },
        },
        ConsultationNotes: {
          // Patients only see notes explicitly marked visible; staff see all
          ...(access === "owner" ? { where: { showOnPatient: true } } : {}),
          select: {
            id: true,
            section: true,
            content: true,
            showOnPatient: true,
          },
          orderBy: { id: "asc" },
        },
        Prescriptions: {
          where: { isActive: true },
          select: { id: true },
        },
        MedicalCertificates: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        LaboratoryRequests: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        ImagingRequests: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        Appointment: {
          select: {
            id: true,
            subject: true,
            complaint: true,
            AppointmentAttribute: {
              select: {
                status: true,
                date: true,
                timeStart: true,
                timeEnd: true,
                AppointmentType: { select: { name: true } },
                AppointmentMode: { select: { name: true } },
                Service: { select: { name: true } },
              },
            },
            PreAssessmentNotes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                assessment: true,
                homeInstructions: true,
                remarks: true,
              },
            },
          },
        },
      },
    });

    return {
      message: "Patient history fetched",
      data: {
        patient: {
          id: numericPatientId,
          userId: patientUserId,
          firstName: patientUser.firstName,
          middleName: patientUser.middleName,
          lastName: patientUser.lastName,
          suffix: patientUser.suffix,
          picture: patientUser.picture,
          gender: patientUser.gender,
          dob: patientUser.dob,
          fullName: [
            patientUser.firstName,
            patientUser.middleName,
            patientUser.lastName,
          ]
            .filter(Boolean)
            .join(" "),
        },
        appointments,
        consultationTickets,
      },
    };
  }
);
