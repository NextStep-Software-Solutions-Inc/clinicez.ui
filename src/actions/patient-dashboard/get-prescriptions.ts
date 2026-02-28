'use server'

import prisma from '@/lib/prisma'
import type { ActivePrescriptionsData, PrescriptionData, Medicine } from '@/types/patient-dashboard-v2.types'

/**
 * Get active prescriptions for patient
 * clinicPatientId refers to ClinicPatient.id (PK), which is what patientId field uses in Prescription
 */
export async function getActivePrescriptions(
  clinicPatientIds: number[]
): Promise<ActivePrescriptionsData> {
  try {
    if (clinicPatientIds.length === 0) {
      return { prescriptions: [], total: 0, lowRefillCount: 0 }
    }
    // Query prescriptions directly using clinicPatientIds (stored in patientId field)
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: { in: clinicPatientIds },
        isActive: true,
        isArchived: false,
      },
      include: {
        Medicines: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            brandName: true,
            genericName: true,
            dosage: true,
            frequency: true,
            unit: true,
            duration: true,
            qty: true,
            notes: true,
            isActive: true,
          },
        },
        HealthcareProvider: {
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
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map Prisma results to PrescriptionData type
    const result: PrescriptionData[] = prescriptions.map(rx => ({
      id: rx.id,
      serialNumber: rx.serialNumber,
      name: rx.name,
      subject: rx.name || 'Prescription',
      status: rx.isArchived ? 'archived' : 'active',
      isActive: rx.isActive,
      isArchived: rx.isArchived,
      prescribedBy: {
        id: rx.HealthcareProvider.id,
        firstName: rx.HealthcareProvider.User?.firstName ?? null,
        lastName: rx.HealthcareProvider.User?.lastName ?? null,
        specialization: rx.HealthcareProvider.HPProfile?.specialties?.[0] ?? null,
      },
      clinic: rx.Clinic,
      medicines: rx.Medicines,
      createdAt: rx.createdAt,
      updatedAt: rx.updatedAt,
      dateArchived: rx.dateArchived,
      transactionNumber: rx.transactionNumber,
      remarks: rx.remarks,
    }))

    // Count prescriptions with medicines that have low quantity or warning notes
    const lowRefillCount = result.filter(rx => 
      rx.medicines.some(medicine => 
        medicine.qty !== null && medicine.qty < 5 || 
        medicine.notes?.toLowerCase().includes('low') === true
      )
    ).length

    return {
      prescriptions: result,
      total: result.length,
      lowRefillCount,
    }
  } catch (error) {
    console.error('Error fetching active prescriptions:', error)
    return {
      prescriptions: [],
      total: 0,
      lowRefillCount: 0,
    }
  }
}
