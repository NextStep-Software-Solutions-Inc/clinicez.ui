"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export type ClinicReportParams = {
  clinicUid: string;
  from: Date;
  to: Date;
};

export type GetClinicReports = Awaited<ReturnType<typeof getClinicReportsAction>>;

export const getClinicReportsAction = withErrorHandling(
  async ({ clinicUid, from, to }: ClinicReportParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const clinic = await prisma.clinic.findFirst({
      where: { clinicUid, isActive: true },
      select: { id: true, name: true, clinicUid: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const dateFilter = { gte: from, lte: to };

    const [
      appointments,
      consultations,
      newPatients,
      totalPatients,
      prescriptions,
      labRequests,
      imagingRequests,
      heartRequests,
      medicalCertificates,
      referralSlips,
    ] = await Promise.all([
      // Appointments created in period
      prisma.appointment.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: dateFilter,
        },
        select: {
          id: true,
          subject: true,
          createdAt: true,
          AppointmentAttribute: {
            select: {
              status: true,
              date: true,
              AppointmentMode: { select: { name: true } },
              AppointmentType: { select: { name: true } },
              Service: {
                select: {
                  name: true,
                  ServiceCategory: { select: { name: true } },
                },
              },
            },
          },
        },
      }),

      // Consultation tickets created in period
      prisma.consultationTicket.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          createdAt: dateFilter,
        },
        select: {
          id: true,
          createdAt: true,
          ConsultationTicketAttribute: { select: { status: true } },
          ConsultationTicketHPs: {
            select: {
              HealthCareProvider: {
                select: {
                  id: true,
                  HPProfile: { select: { name: true } },
                  User: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),

      // New patients registered in period
      prisma.clinicPatient.count({
        where: { Clinic: { clinicUid }, createdAt: dateFilter },
      }),

      // Total active patients
      prisma.clinicPatient.count({
        where: { Clinic: { clinicUid }, isActive: true },
      }),

      // Prescriptions in period
      prisma.prescription.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // Lab requests in period
      prisma.clinicLaboratoryRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // Imaging requests in period
      prisma.clinicImagingRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // Heart station requests in period
      prisma.clinicHeartStationRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // Medical certificates in period
      prisma.clinicMedicalCertificate.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // Referral slips in period
      prisma.clinicReferralSlip.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
    ]);

    // Process appointment stats
    const appointmentStatusCounts: Record<string, number> = {};
    const appointmentModeCounts: Record<string, number> = {};
    const appointmentTypeCounts: Record<string, number> = {};
    const appointmentServiceCounts: Record<string, { count: number; category: string }> = {};
    const appointmentsByDay: Record<string, number> = {};
    let walkInCount = 0;
    let scheduledCount = 0;

    for (const apt of appointments) {
      const status = apt.AppointmentAttribute?.status ?? "UNKNOWN";
      appointmentStatusCounts[status] = (appointmentStatusCounts[status] ?? 0) + 1;

      const mode = apt.AppointmentAttribute?.AppointmentMode?.name ?? "Unknown";
      appointmentModeCounts[mode] = (appointmentModeCounts[mode] ?? 0) + 1;

      const type = apt.AppointmentAttribute?.AppointmentType?.name ?? "Unknown";
      appointmentTypeCounts[type] = (appointmentTypeCounts[type] ?? 0) + 1;

      const serviceName = apt.AppointmentAttribute?.Service?.name ?? "Unknown";
      const category =
        apt.AppointmentAttribute?.Service?.ServiceCategory?.name ?? "Unknown";
      if (!appointmentServiceCounts[serviceName]) {
        appointmentServiceCounts[serviceName] = { count: 0, category };
      }
      appointmentServiceCounts[serviceName].count++;

      const day = apt.createdAt.toISOString().slice(0, 10);
      appointmentsByDay[day] = (appointmentsByDay[day] ?? 0) + 1;

      if (apt.subject.startsWith("Walk-in:")) {
        walkInCount++;
      } else {
        scheduledCount++;
      }
    }

    // Process consultation stats
    const consultationStatusCounts: Record<string, number> = {};
    const consultationsByDay: Record<string, number> = {};
    const hpConsultationCounts: Record<string, number> = {};

    for (const ct of consultations) {
      const status = ct.ConsultationTicketAttribute?.status ?? "UNKNOWN";
      consultationStatusCounts[status] =
        (consultationStatusCounts[status] ?? 0) + 1;

      const day = ct.createdAt.toISOString().slice(0, 10);
      consultationsByDay[day] = (consultationsByDay[day] ?? 0) + 1;

      for (const ctHp of ct.ConsultationTicketHPs) {
        const hp = ctHp.HealthCareProvider;
        const hpName =
          hp.HPProfile?.name ??
          (`${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim() || "Unknown");
        hpConsultationCounts[hpName] =
          (hpConsultationCounts[hpName] ?? 0) + 1;
      }
    }

    return {
      message: "Reports retrieved successfully",
      data: {
        clinic,
        period: { from: from.toISOString(), to: to.toISOString() },
        appointments: {
          total: appointments.length,
          walkIn: walkInCount,
          scheduled: scheduledCount,
          byStatus: Object.entries(appointmentStatusCounts)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
          byMode: Object.entries(appointmentModeCounts)
            .map(([mode, count]) => ({ mode, count }))
            .sort((a, b) => b.count - a.count),
          byType: Object.entries(appointmentTypeCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count),
          byService: Object.entries(appointmentServiceCounts)
            .map(([service, { count, category }]) => ({
              service,
              count,
              category,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          dailyTrend: Object.entries(appointmentsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        },
        consultations: {
          total: consultations.length,
          byStatus: Object.entries(consultationStatusCounts)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
          byHP: Object.entries(hpConsultationCounts)
            .map(([hp, count]) => ({ hp, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          dailyTrend: Object.entries(consultationsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        },
        patients: {
          newInPeriod: newPatients,
          totalActive: totalPatients,
        },
        diagnostics: {
          prescriptions,
          labRequests,
          imagingRequests,
          heartRequests,
          medicalCertificates,
          referralSlips,
          total:
            prescriptions +
            labRequests +
            imagingRequests +
            heartRequests +
            medicalCertificates +
            referralSlips,
        },
      },
    };
  }
);
