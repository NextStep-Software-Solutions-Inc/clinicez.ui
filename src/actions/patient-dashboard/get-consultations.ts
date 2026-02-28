'use server'

import prisma from '@/lib/prisma'
import type { RecentConsultationsData } from '@/types/patient-dashboard-v2.types'

/**
 * Get recent consultation notes visible to patient
 * patientId here actually refers to ClinicPatient.id
 */
export async function getRecentConsultations(
  clinicPatientIds: number[],
  patientId: number,
  limit: number = 5
): Promise<RecentConsultationsData> {
  try {
    if (clinicPatientIds.length === 0) {
      return { consultations: [], total: 0 }
    }

    // Get consultation tickets belonging to this patient across all clinics
    const consultationTickets = await prisma.consultationTicket.findMany({
      where: {
        isActive: true,
        OR: [
          { clinicPatientId: { in: clinicPatientIds } },
          { Appointment: { Requesters: { some: { userId: patientId } } } },
        ],
      },
      include: {
        ConsultationNotes: {
          where: { showOnPatient: true },
          include: {
            HealthCareProvider: {
              select: {
                id: true,
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                HPProfile: {
                  select: {
                    specialties: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        ConsultationTicketAttribute: {
          include: {
            NoteTemplate: {
              include: {
                NoteSections: true,
              },
            },
          },
        },
        ConsultationTicketHPs: {
          include: {
            HealthCareProvider: {
              select: {
                id: true,
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
        Appointment: {
          select: {
            caseNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const result = consultationTickets.map((ticket: (typeof consultationTickets)[0]) => {
      // Build maps for section lookup by name and by ID
      const sectionLabelMapByName = new Map<string, string>()
      const sectionLabelMapById = new Map<number, string>()

      ticket.ConsultationTicketAttribute?.NoteTemplate?.NoteSections?.forEach((section) => {
        sectionLabelMapByName.set(section.name, section.label)
        sectionLabelMapById.set(section.id, section.label)
      })

      return ({
        ticketId: ticket.id,
        subject: ticket.subject,
        caseNumber: ticket.caseNumber,
        status: ticket.isArchived ? 'archived' : 'active',
        notes: ticket.ConsultationNotes.map((note: (typeof ticket.ConsultationNotes)[0]) => {
          // Get the label for this section - handle both numeric IDs and string names
          let sectionLabel = ''

          // Try to parse as numeric ID first
          const numericId = parseInt(note.section, 10)
          if (!isNaN(numericId)) {
            sectionLabel = sectionLabelMapById.get(numericId) || note.section
          } else {
            // Try as string name
            sectionLabel = sectionLabelMapByName.get(note.section) || note.section
          }

          return ({
            id: note.id,
            consultationTicketId: note.consultationTicketId,
            section: note.section,
            sectionLabel,
            content: note.content,
            showOnPatient: note.showOnPatient,
            doctor: {
              id: note.HealthCareProvider.id,
              firstName: note.HealthCareProvider.User?.firstName || null,
              lastName: note.HealthCareProvider.User?.lastName || null,
              specialization:
                note.HealthCareProvider.HPProfile?.specialties?.[0] || null,
            },
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          })
        }),
        doctors: ticket.ConsultationTicketHPs.map((hp: (typeof ticket.ConsultationTicketHPs)[0]) => ({
          id: hp.HealthCareProvider.id,
          firstName: hp.HealthCareProvider.User?.firstName || null,
          lastName: hp.HealthCareProvider.User?.lastName || null,
        })),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })
    })

    return {
      consultations: result,
      total: result.length,
    }
  } catch (error) {
    console.error('Error fetching recent consultations:', error)
    return { consultations: [], total: 0 }
  }
}
