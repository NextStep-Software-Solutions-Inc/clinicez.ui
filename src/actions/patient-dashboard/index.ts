'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import type { PatientDashboardData } from '@/types/patient-dashboard-v2.types'
import { getNextAppointment, getUpcomingAppointments } from './get-appointments'
import { getLatestVitals, getVitalsHistory } from './get-vitals'
import { getActivePrescriptions } from './get-prescriptions'
import { getRecentConsultations } from './get-consultations'
import { getPendingLabWork } from './get-lab-work'
import { getImagingRequests } from './get-imaging-requests'
import { getHeartStationRequests } from './get-heart-station-requests'

/**
 * Get complete patient dashboard data
 * Fetches all sections: appointments, vitals, prescriptions, consultations, lab work
 * 
 * This is the main entry point for loading the dashboard
 */
export async function getPatientDashboardData(): Promise<PatientDashboardData | null> {
  try {
    const user = await currentUser()
    if (!user?.id) return null

    // Get patient record
    const patient = await prisma.user.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        nickname: true,
        picture: true,
        email: true,
        dob: true,
        gender: true,
        caseNumber: true,
      },
    })

    if (!patient) return null

    // Get ALL clinic patient records for this patient (across all clinics)
    const clinicPatients = await prisma.clinicPatient.findMany({
      where: { patientId: patient.id },
      select: { id: true },
    })

    const clinicPatientIds = clinicPatients.map(cp => cp.id)

    // Fetch all dashboard data in parallel
    const [
      nextAppointment,
      upcomingAppointments,
      latestVitals,
      vitalHistory,
      prescriptions,
      recentConsultations,
      pendingLabWork,
      imagingRequests,
      heartStationRequests,
    ] = await Promise.all([
      getNextAppointment(user.id),
      getUpcomingAppointments(user.id, 3),
      getLatestVitals(patient.id),
      getVitalsHistory(patient.id, 7),
      getActivePrescriptions(clinicPatientIds),
      getRecentConsultations(clinicPatientIds, user.id, 5),
      getPendingLabWork(clinicPatientIds),
      getImagingRequests(clinicPatientIds),
      getHeartStationRequests(clinicPatientIds),
    ])

    return {
      patient: {
        id: patient.id,
        userId: patient.userId,
        nickname: patient.nickname,
        firstName: patient.firstName,
        lastName: patient.lastName,
        picture: patient.picture,
        email: patient.email,
        dob: patient.dob,
        gender: patient.gender,
      },
      nextAppointment,
      upcomingAppointments,
      latestVitals,
      vitalHistory,
      prescriptions,
      recentConsultations,
      pendingLabWork,
      imagingRequests,
      heartStationRequests,
      lastUpdated: new Date(),
      dataCompleteness: {
        hasAppointments: nextAppointment.appointment !== null,
        hasVitals: latestVitals.vitals !== null,
        hasPrescriptions: prescriptions.total > 0,
        hasConsultations: recentConsultations.total > 0,
        hasLabRequests: pendingLabWork.total > 0,
      },
    }
  } catch (error) {
    console.error('Error fetching patient dashboard data:', error)
    return null
  }
}

/**
 * Revalidate & refetch dashboard data (for refreshing)
 * Using ISR/on-demand revalidation
 */
export async function revalidateDashboardData() {
  try {
    // This would typically be used with Next.js ISR or on-demand revalidation
    // For now, just return fresh data
    return await getPatientDashboardData()
  } catch (error) {
    console.error('Error revalidating dashboard data:', error)
    return null
  }
}
