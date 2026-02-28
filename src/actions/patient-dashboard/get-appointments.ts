'use server'

import prisma from '@/lib/prisma'
import type { NextAppointmentData, UpcomingAppointmentsData, DashboardAppointment } from '@/types/patient-dashboard-v2.types'

function buildHpName(hpProfile: { title?: string | null; name?: string | null; suffix?: string | null } | null | undefined): string | null {
  if (!hpProfile) return null
  const name = [hpProfile.title, hpProfile.name, hpProfile.suffix]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(' ')
  return name || null
}

/**
 * Get next upcoming appointment for patient
 * Returns appointment with doctor, clinic, and mode details
 */
export async function getNextAppointment(patientId: number): Promise<NextAppointmentData> {
  try {
    // Get next appointment for this patient across all clinics
    const appointment = await prisma.appointment.findFirst({
      where: {
        Requesters: { some: { userId: patientId } },
        AppointmentAttribute: {
          status: { in: ['PENDING', 'CONFIRMED', 'ROUTED', 'RECEIVED'] },
          date: { gte: new Date() },
        },
      },
      orderBy: {
        AppointmentAttribute: {
          date: 'asc',
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
    })

    if (!appointment?.AppointmentAttribute) {
      return {
        appointment: null,
        daysUntil: null,
        hoursUntil: null,
        isToday: false,
        isUpcoming: false,
        isPast: false,
      }
    }

    const attr = appointment.AppointmentAttribute
    const appointmentDate = attr.date ? new Date(attr.date) : null

    if (!appointmentDate) {
      return {
        appointment: null,
        daysUntil: null,
        hoursUntil: null,
        isToday: false,
        isUpcoming: false,
        isPast: false,
      }
    }

    const now = new Date()
    const diffMs = appointmentDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    const isToday =
      appointmentDate.toDateString() === now.toDateString()
    const isUpcoming = diffMs > 0
    const isPast = diffMs < 0

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

    const appointmentData: DashboardAppointment = {
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
    }

    return {
      appointment: appointmentData,
      daysUntil: isUpcoming ? diffDays : null,
      hoursUntil: isUpcoming ? diffHours : null,
      isToday,
      isUpcoming,
      isPast,
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
      take: limit,
    })

    const result: DashboardAppointment[] = appointments
      .filter((a) => a.AppointmentAttribute)
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
