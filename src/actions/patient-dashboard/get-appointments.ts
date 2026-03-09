'use server'

import prisma from '@/lib/prisma'
import { combineDateWithTime } from '@/lib/day-utils'
import type { NextAppointmentData, UpcomingAppointmentsData, DashboardAppointment } from '@/types/patient-dashboard-v2.types'

function buildHpName(hpProfile: { title?: string | null; name?: string | null; suffix?: string | null } | null | undefined): string | null {
  if (!hpProfile) return null
  const name = [hpProfile.title, hpProfile.name, hpProfile.suffix]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(' ')
  return name || null
}

/** Shared Prisma include shape used by both upcoming and previous appointment queries. */
const APPOINTMENT_INCLUDE = {
  AppointmentAttribute: {
    include: {
      PreferredAppointee: {
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              picture: true,
            },
          },
          HPProfile: {
            select: {
              name: true,
              title: true,
              suffix: true,
              specialties: true,
            },
          },
        },
      },
      AppointmentMode: true,
      AppointmentType: true,
      Service: true,
    },
  },
  Clinic: {
    select: {
      id: true,
      name: true,
      clinicUid: true,
    },
  },
} as const

type PrismaAppointmentWithIncludes = Awaited<ReturnType<typeof prisma.appointment.findFirst<{ include: typeof APPOINTMENT_INCLUDE }>>>

/** Map a Prisma appointment row to the DashboardAppointment shape. */
function mapRowToDashboardAppointment(row: NonNullable<PrismaAppointmentWithIncludes>): DashboardAppointment {
  const attr = row.AppointmentAttribute!
  const doctor = attr.PreferredAppointee
    ? {
        id: attr.PreferredAppointee.id,
        firstName: attr.PreferredAppointee.User?.firstName ?? null,
        lastName: attr.PreferredAppointee.User?.lastName ?? null,
        hpName: buildHpName(attr.PreferredAppointee.HPProfile),
        specialization: attr.PreferredAppointee.HPProfile?.specialties?.[0] ?? null,
        picture: attr.PreferredAppointee.User?.picture ?? null,
      }
    : { id: 0, firstName: 'Unassigned', lastName: 'Doctor', hpName: null, specialization: null, picture: null }

  return {
    id: row.id,
    caseNumber: row.caseNumber,
    subject: row.subject,
    complaint: row.complaint,
    date: attr.date,
    timeStart: attr.timeStart,
    timeEnd: attr.timeEnd,
    status: attr.status,
    recurring: attr.recurring,
    maxDuration: attr.maxDuration,
    meetingUrl: attr.meetingUrl,
    doctor,
    clinic: { id: row.Clinic.id, name: row.Clinic.name, uid: row.Clinic.clinicUid },
    mode: { id: attr.AppointmentMode?.id ?? 0, name: attr.AppointmentMode?.name ?? 'Unknown' },
    service: { id: attr.Service?.id ?? 0, name: attr.Service?.name ?? 'General' },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * Get next upcoming appointment for patient.
 * When there is no upcoming appointment, `previousAppointment` will contain the
 * most recent past appointment so the UI can display it with the elapsed time.
 */
export async function getNextAppointment(patientId: number): Promise<NextAppointmentData> {
  try {
    // Fetch up to 10 upcoming appointments (by date) so we can skip any that
    // have already elapsed on the same day (date is a DATE-only field in the DB,
    // so "today" appointments pass the date filter regardless of timeStart).
    const upcomingRows = await prisma.appointment.findMany({
      where: {
        Requesters: { some: { userId: patientId } },
        AppointmentAttribute: {
          status: { in: ['PENDING', 'CONFIRMED', 'ROUTED', 'RECEIVED'] },
          date: { gte: new Date() },
        },
      },
      orderBy: { AppointmentAttribute: { date: 'asc' } },
      take: 10,
      include: APPOINTMENT_INCLUDE,
    })

    const now = new Date()

    // Find the first appointment that has not yet elapsed (uses combined date+timeStart)
    let upcomingAppointment: NonNullable<PrismaAppointmentWithIncludes> | null = null
    for (const apt of upcomingRows) {
      const attr = apt.AppointmentAttribute
      if (!attr?.date) continue
      if (combineDateWithTime(new Date(attr.date), attr.timeStart) >= now) {
        upcomingAppointment = apt
        break
      }
    }

    // Only fetch the previous appointment when there is no upcoming one
    let previousAppointment: DashboardAppointment | null = null
    if (!upcomingAppointment) {
      const previousRow = await prisma.appointment.findFirst({
        where: {
          Requesters: { some: { userId: patientId } },
          AppointmentAttribute: { date: { lt: new Date() } },
        },
        orderBy: { AppointmentAttribute: { date: 'desc' } },
        include: APPOINTMENT_INCLUDE,
      })
      if (previousRow?.AppointmentAttribute) {
        previousAppointment = mapRowToDashboardAppointment(previousRow)
      }
    }

    if (!upcomingAppointment?.AppointmentAttribute) {
      return {
        appointment: null,
        daysUntil: null,
        hoursUntil: null,
        isToday: false,
        isUpcoming: false,
        isPast: false,
        previousAppointment,
      }
    }

    const attr = upcomingAppointment.AppointmentAttribute
    const appointmentDate = attr.date ? new Date(attr.date) : null

    if (!appointmentDate) {
      return {
        appointment: null,
        daysUntil: null,
        hoursUntil: null,
        isToday: false,
        isUpcoming: false,
        isPast: false,
        previousAppointment,
      }
    }

    // Use combined date+timeStart for accurate diff calculations
    const fullAppointmentDateTime = combineDateWithTime(new Date(appointmentDate), attr.timeStart)

    const diffMs = fullAppointmentDateTime.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    const isToday = appointmentDate.toDateString() === now.toDateString()
    const isUpcoming = diffMs > 0
    const isPast = diffMs < 0

    return {
      appointment: mapRowToDashboardAppointment(upcomingAppointment),
      daysUntil: isUpcoming ? diffDays : null,
      hoursUntil: isUpcoming ? diffHours : null,
      isToday,
      isUpcoming,
      isPast,
      previousAppointment,
    }
  } catch (error) {
    console.error('Error fetching next appointment:', error)
    return {
      appointment: null,
      daysUntil: null,
      hoursUntil: null,
      isToday: false,
      isUpcoming: false,
      isPast: false,
      previousAppointment: null,
    }
  }
}

/**
 * Get next 3 upcoming appointments for patient
 */
export async function getUpcomingAppointments(
  patientId: number,
  limit: number = 3
): Promise<UpcomingAppointmentsData> {
  try {
    // Get upcoming appointments across all clinics, sorted by date
    const appointments = await prisma.appointment.findMany({
      where: {
        Requesters: { some: { userId: patientId } },
        AppointmentAttribute: {
          status: { in: ['PENDING', 'CONFIRMED', 'ROUTED', 'RECEIVED', 'RESCHEDULED'] },
          date: { gte: new Date() },
        },
      },
      include: {
        AppointmentAttribute: {
          include: {
            PreferredAppointee: {
              include: {
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                    picture: true,
                  },
                },
                HPProfile: {
                  select: {
                    name: true,
                    title: true,
                    suffix: true,
                    specialties: true,
                  },
                },
              },
            },
            AppointmentMode: true,
            AppointmentType: true,
            Service: true,
          },
        },
        Clinic: {
          select: {
            id: true,
            name: true,
            clinicUid: true,
          },
        },
      },
      orderBy: {
        AppointmentAttribute: {
          date: 'asc',
        },
      },
      take: limit + 5, // Fetch a few extra to account for elapsed same-day appointments
    })

    const now = new Date()

    const result: DashboardAppointment[] = appointments
      .filter((a) => {
        if (!a.AppointmentAttribute) return false
        const attr = a.AppointmentAttribute
        if (!attr.date) return false

        // Combine date+timeStart to skip elapsed appointments
        return combineDateWithTime(new Date(attr.date), attr.timeStart) >= now
      })
      .slice(0, limit)
      .map((appointment: (typeof appointments)[0]) => {
        const attr = appointment.AppointmentAttribute!
        const doctor = attr.PreferredAppointee
          ? {
            id: attr.PreferredAppointee.id,
            firstName: attr.PreferredAppointee.User?.firstName ?? null,
            lastName: attr.PreferredAppointee.User?.lastName ?? null,
            hpName: buildHpName(attr.PreferredAppointee.HPProfile),
            specialization:
              attr.PreferredAppointee.HPProfile?.specialties?.[0] ?? null,
            picture: attr.PreferredAppointee.User?.picture ?? null,
          }
          : {
            id: 0,
            firstName: 'Unassigned',
            lastName: 'Doctor',
            hpName: null,
            specialization: null,
            picture: null,
          }

        return {
          id: appointment.id,
          caseNumber: appointment.caseNumber,
          subject: appointment.subject,
          complaint: appointment.complaint,
          date: attr.date,
          timeStart: attr.timeStart,
          timeEnd: attr.timeEnd,
          status: attr.status,
          recurring: attr.recurring,
          maxDuration: attr.maxDuration,
          meetingUrl: attr.meetingUrl,
          doctor,
          clinic: {
            id: appointment.Clinic.id,
            name: appointment.Clinic.name,
            uid: appointment.Clinic.clinicUid,
          },
          mode: {
            id: attr.AppointmentMode?.id ?? 0,
            name: attr.AppointmentMode?.name ?? 'Unknown',
          },
          service: {
            id: attr.Service?.id ?? 0,
            name: attr.Service?.name ?? 'General',
          },
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        } as DashboardAppointment
      })

    return {
      appointments: result,
      total: appointments.length,
    }
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error)
    return { appointments: [], total: 0 }
  }
}
