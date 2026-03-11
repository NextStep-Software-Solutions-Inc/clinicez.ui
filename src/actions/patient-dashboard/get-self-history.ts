'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { withErrorHandling } from '@/lib/with-error-handling'

/**
 * Fetches all appointments and consultation tickets for the currently
 * authenticated patient across ALL their clinics.
 *
 * Consultation notes are filtered to `showOnPatient: true` because this
 * action is only ever called on behalf of the patient themselves.
 */
export type GetPatientSelfHistory = Awaited<ReturnType<typeof getPatientSelfHistoryAction>>

export const getPatientSelfHistoryAction = withErrorHandling(async () => {
  const user = await currentUser()
  if (!user?.id) throw new Error('Unauthorized')

  const userId = user.id

  // Resolve the internal User record
  const userRecord = await prisma.user.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      picture: true,
      gender: true,
      dob: true,
    },
  })

  if (!userRecord) throw new Error('User record not found')

  // ------------------------------------------------------------------
  // Appointments where this user is a requester
  // ------------------------------------------------------------------
  const appointments = await prisma.appointment.findMany({
    where: {
      isActive: true,
      Requesters: {
        some: { User: { userId } },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      updatedAt: true,
      Clinic: {
        select: { id: true, name: true, clinicUid: true },
      },
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
        // Only include active assignments — DECLINED/CANCELLED must never surface
        // as the patient's "Healthcare Provider". Order so ACCEPTED appears first.
        where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        take: 1,
        orderBy: [
          // 'ACCEPTED' sorts before 'PENDING' alphabetically, giving preference
          // to the HP who has actively confirmed the assignment.
          // These two status values are stable constants (see appointment-routing.action.ts).
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
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
    },
  })

  // ------------------------------------------------------------------
  // Consultation tickets linked to this patient (via appointment OR direct link)
  // ------------------------------------------------------------------
  const consultationTickets = await prisma.consultationTicket.findMany({
    where: {
      isActive: true,
      OR: [
        {
          Appointment: {
            Requesters: {
              some: { User: { userId } },
            },
          },
        },
        {
          ClinicPatient: {
            Patient: { userId },
          },
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subject: true,
      createdAt: true,
      updatedAt: true,
      isArchived: true,
      caseNumber: true,
      Clinic: {
        select: { id: true, name: true, clinicUid: true },
      },
      ConsultationTicketAttribute: {
        select: { status: true },
      },
      ConsultationTicketHPs: {
        select: {
          HealthCareProvider: {
            select: {
              id: true,
              HPProfile: { select: { title: true, name: true, suffix: true } },
              User: { select: { firstName: true, lastName: true } },
              HPType: { select: { name: true } },
            },
          },
        },
      },
      // Patient only sees notes explicitly marked visible
      ConsultationNotes: {
        where: { showOnPatient: true },
        select: {
          id: true,
          section: true,
          content: true,
          showOnPatient: true,
        },
        orderBy: { id: 'asc' },
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
      HeartStationRequests: {
        where: { isActive: true, deletedAt: null },
        select: { id: true },
      },
      ClinicReferralSlips: {
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
        },
      },
    },
  })

  const fullName = [userRecord.firstName, userRecord.middleName, userRecord.lastName, userRecord.suffix]
    .filter(Boolean)
    .join(' ')

  return {
    message: 'Patient history fetched',
    data: {
      patient: {
        id: userRecord.id,
        userId: userRecord.userId,
        firstName: userRecord.firstName,
        middleName: userRecord.middleName,
        lastName: userRecord.lastName,
        suffix: userRecord.suffix,
        picture: userRecord.picture,
        gender: userRecord.gender,
        dob: userRecord.dob,
        fullName,
      },
      appointments,
      consultationTickets,
    },
  }
})
