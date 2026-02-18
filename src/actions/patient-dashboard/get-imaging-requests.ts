'use server'

import prisma from '@/lib/prisma'
import type { ImagingRequestData } from '@/types/patient-dashboard-v2.types'

/**
 * Get pending imaging requests for patient
 * clinicPatientId refers to ClinicPatient.id
 */
export async function getImagingRequests(
  clinicPatientId: number
): Promise<{ requests: ImagingRequestData[]; total: number; pendingCount: number }> {
  try {
    const imagingRequests = await prisma.clinicImagingRequest.findMany({
      where: {
        clinicPatientId: clinicPatientId,
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
        ImagingRequestProcedures: {
          include: {
            ImagingProcedure: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = imagingRequests.map((req: (typeof imagingRequests)[0]) => {
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
        reason: req.reason,
        history: req.history,
        procedures: req.ImagingRequestProcedures.map(
          (p: (typeof req.ImagingRequestProcedures)[0]) => p.ImagingProcedure.name
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
    console.error('Error fetching imaging requests:', error)
    return {
      requests: [],
      total: 0,
      pendingCount: 0,
    }
  }
}
