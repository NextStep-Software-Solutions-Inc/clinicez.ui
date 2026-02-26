'use server'

import prisma from '@/lib/prisma'
import type { PendingLabWorkData } from '@/types/patient-dashboard-v2.types'

/**
 * Get pending laboratory requests for patient
 * clinicPatientId refers to ClinicPatient.id
 */
export async function getPendingLabWork(
  clinicPatientIds: number[]
): Promise<PendingLabWorkData> {
  try {
    if (clinicPatientIds.length === 0) {
      return { requests: [], total: 0, pendingCount: 0 }
    }
    const labRequests = await prisma.clinicLaboratoryRequest.findMany({
      where: {
        clinicPatientId: { in: clinicPatientIds },
        isActive: true,
        deletedAt: null,
      },
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
        Clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        LaboratoryRequestProcedures: {
          include: {
            LaboratoryProcedure: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = labRequests.map((req: (typeof labRequests)[0]) => {
      // Determine status based on impression and deletion
      let status: 'pending' | 'completed' | 'cancelled' = 'pending'
      if (req.deletedAt) {
        status = 'cancelled'
      } else if (req.impression && req.impression.trim().length > 0) {
        status = 'completed'
      }

      return {
        id: req.id,
        serialNumber: req.serialNumber,
        consultationTicketId: req.consultationTicketId,
        orderedBy: {
          id: req.HealthCareProvider.id,
          firstName: req.HealthCareProvider.User?.firstName || null,
          lastName: req.HealthCareProvider.User?.lastName || null,
          specialization:
            req.HealthCareProvider.HPProfile?.specialties?.[0] || null,
        },
        clinic: req.Clinic,
        status,
        impression: req.impression,
        procedures: req.LaboratoryRequestProcedures.map(
          (p: (typeof req.LaboratoryRequestProcedures)[0]) => p.LaboratoryProcedure.name
        ),
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      }
    })

    const pendingCount = result.filter((r: (typeof result)[0]) => r.status === 'pending').length

    return {
      requests: result,
      total: result.length,
      pendingCount,
    }
  } catch (error) {
    console.error('Error fetching pending lab work:', error)
    return {
      requests: [],
      total: 0,
      pendingCount: 0,
    }
  }
}
