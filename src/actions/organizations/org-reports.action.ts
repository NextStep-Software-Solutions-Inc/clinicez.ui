"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export type OrgReportParams = {
  orgUid: string;
  from: Date;
  to: Date;
};

export type GetOrgReports = Awaited<ReturnType<typeof getOrgReportsAction>>;

export const getOrgReportsAction = withErrorHandling(
  async ({ orgUid, from, to }: OrgReportParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const org = await prisma.organization.findFirst({
      where: { orgUid, isActive: true },
      select: { id: true, name: true, orgUid: true },
    });
    if (!org) throw new Error("Organization not found");

    const dateFilter = { gte: from, lte: to };

    // Fetch all clinic IDs linked to this org
    const clinicOrgs = await prisma.clinicOrganization.findMany({
      where: { organizationId: org.id, isActive: true },
      select: {
        Clinic: {
          select: {
            id: true,
            clinicUid: true,
            name: true,
            logo: true,
            isActive: true,
          },
        },
      },
    });

    const clinicIds = clinicOrgs
      .filter((co) => co.Clinic.isActive)
      .map((co) => co.Clinic.id);

    const [
      // Org members by role
      orgMembers,
      // Appointments across all org clinics
      appointments,
      // Consultations across all org clinics
      consultations,
      // New patients registered in period (across org clinics)
      newPatients,
      // Total active patients across org clinics
      totalPatients,
      // Patient demographics (all active across org clinics)
      patientDemographics,
      // Diagnostics across org clinics
      prescriptions,
      labRequests,
      imagingRequests,
      heartRequests,
      medicalCertificates,
      referralSlips,
      // Per-clinic appointment counts
      apptPerClinic,
      // Per-clinic consultation counts
      consultPerClinic,
      // Per-clinic patient counts
      patientPerClinic,
    ] = await Promise.all([
      // ── Org members by role ──────────────────────────────────────────────
      prisma.organizationMember.findMany({
        where: { organizationId: org.id, status: "ACTIVE" },
        select: {
          OrganizationRole: { select: { name: true } },
          User: { select: { firstName: true, lastName: true } },
          createdAt: true,
        },
      }),

      // ── Appointments ─────────────────────────────────────────────────────
      prisma.appointment.findMany({
        where: {
          clinicId: { in: clinicIds },
          isActive: true,
          deletedAt: null,
          createdAt: dateFilter,
        },
        select: {
          id: true,
          subject: true,
          clinicId: true,
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

      // ── Consultations ─────────────────────────────────────────────────────
      prisma.consultationTicket.findMany({
        where: {
          clinicId: { in: clinicIds },
          isActive: true,
          createdAt: dateFilter,
        },
        select: {
          id: true,
          clinicId: true,
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

      // ── New patients registered in period ────────────────────────────────
      prisma.clinicPatient.count({
        where: { clinicId: { in: clinicIds }, createdAt: dateFilter },
      }),

      // ── Total active patients across org clinics ──────────────────────────
      prisma.clinicPatient.count({
        where: { clinicId: { in: clinicIds }, isActive: true },
      }),

      // ── Patient demographics ──────────────────────────────────────────────
      prisma.clinicPatient.findMany({
        where: { clinicId: { in: clinicIds }, isActive: true },
        select: {
          createdAt: true,
          Patient: {
            select: {
              gender: true,
              dob: true,
              civilStatus: true,
              bloodType: true,
            },
          },
        },
      }),

      // ── Diagnostics counts ────────────────────────────────────────────────
      prisma.prescription.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicLaboratoryRequest.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicImagingRequest.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicHeartStationRequest.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicMedicalCertificate.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicReferralSlip.count({
        where: { clinicId: { in: clinicIds }, isActive: true, createdAt: dateFilter },
      }),

      // ── Per-clinic appointment counts (in period) ─────────────────────────
      prisma.appointment.groupBy({
        by: ["clinicId"],
        where: {
          clinicId: { in: clinicIds },
          isActive: true,
          deletedAt: null,
          createdAt: dateFilter,
        },
        _count: { id: true },
      }),

      // ── Per-clinic consultation counts (in period) ────────────────────────
      prisma.consultationTicket.groupBy({
        by: ["clinicId"],
        where: {
          clinicId: { in: clinicIds },
          isActive: true,
          createdAt: dateFilter,
        },
        _count: { id: true },
      }),

      // ── Per-clinic patient counts (all active) ────────────────────────────
      prisma.clinicPatient.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds }, isActive: true },
        _count: { id: true },
      }),
    ]);

    // ── Process member stats ──────────────────────────────────────────────────
    const membersByRole: Record<string, number> = {};
    for (const m of orgMembers) {
      const role = m.OrganizationRole.name;
      membersByRole[role] = (membersByRole[role] ?? 0) + 1;
    }

    // ── Process appointment stats ─────────────────────────────────────────────
    const appointmentStatusCounts: Record<string, number> = {};
    const appointmentModeCounts: Record<string, number> = {};
    const appointmentTypeCounts: Record<string, number> = {};
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

      const day = apt.createdAt.toISOString().slice(0, 10);
      appointmentsByDay[day] = (appointmentsByDay[day] ?? 0) + 1;

      if (apt.subject.startsWith("Walk-in:")) {
        walkInCount++;
      } else {
        scheduledCount++;
      }
    }

    // ── Process consultation stats ────────────────────────────────────────────
    const consultationStatusCounts: Record<string, number> = {};
    const consultationsByDay: Record<string, number> = {};
    const hpConsultationCounts: Record<string, number> = {};

    for (const ct of consultations) {
      const status = ct.ConsultationTicketAttribute?.status ?? "UNKNOWN";
      consultationStatusCounts[status] = (consultationStatusCounts[status] ?? 0) + 1;

      const day = ct.createdAt.toISOString().slice(0, 10);
      consultationsByDay[day] = (consultationsByDay[day] ?? 0) + 1;

      for (const ctHp of ct.ConsultationTicketHPs) {
        const hp = ctHp.HealthCareProvider;
        const hpName =
          hp.HPProfile?.name ??
          (`${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim() || "Unknown");
        hpConsultationCounts[hpName] = (hpConsultationCounts[hpName] ?? 0) + 1;
      }
    }

    // ── Process patient demographics ──────────────────────────────────────────
    const genderCounts: Record<string, number> = {};
    const ageGroupCounts: Record<string, number> = {
      "0-12": 0,
      "13-17": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-59": 0,
      "60+": 0,
      "Unknown": 0,
    };

    const now = new Date();
    for (const cp of patientDemographics) {
      const p = cp.Patient;
      const g = p.gender ?? "Unknown";
      genderCounts[g] = (genderCounts[g] ?? 0) + 1;

      if (p.dob) {
        const ageYears = Math.floor(
          (now.getTime() - new Date(p.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        );
        if (ageYears <= 12) ageGroupCounts["0-12"]++;
        else if (ageYears <= 17) ageGroupCounts["13-17"]++;
        else if (ageYears <= 25) ageGroupCounts["18-25"]++;
        else if (ageYears <= 35) ageGroupCounts["26-35"]++;
        else if (ageYears <= 45) ageGroupCounts["36-45"]++;
        else if (ageYears <= 59) ageGroupCounts["46-59"]++;
        else ageGroupCounts["60+"]++;
      } else {
        ageGroupCounts["Unknown"]++;
      }
    }

    // ── Build per-clinic breakdown ─────────────────────────────────────────────
    const apptByClinicMap = new Map(apptPerClinic.map((r) => [r.clinicId, r._count.id]));
    const consultByClinicMap = new Map(consultPerClinic.map((r) => [r.clinicId, r._count.id]));
    const patientByClinicMap = new Map(patientPerClinic.map((r) => [r.clinicId, r._count.id]));

    const clinicsBreakdown = clinicOrgs
      .filter((co) => co.Clinic.isActive)
      .map((co) => ({
        clinicUid: co.Clinic.clinicUid,
        name: co.Clinic.name,
        logo: co.Clinic.logo,
        appointments: apptByClinicMap.get(co.Clinic.id) ?? 0,
        consultations: consultByClinicMap.get(co.Clinic.id) ?? 0,
        patients: patientByClinicMap.get(co.Clinic.id) ?? 0,
      }))
      .sort((a, b) => b.appointments - a.appointments);

    return {
      message: "Organization reports retrieved successfully",
      data: {
        org,
        period: { from: from.toISOString(), to: to.toISOString() },
        clinics: {
          total: clinicsBreakdown.length,
          breakdown: clinicsBreakdown,
        },
        members: {
          total: orgMembers.length,
          byRole: Object.entries(membersByRole)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count),
        },
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
          byGender: Object.entries(genderCounts)
            .map(([gender, count]) => ({ gender, count }))
            .sort((a, b) => b.count - a.count),
          byAgeGroup: Object.entries(ageGroupCounts)
            .filter(([, c]) => c > 0)
            .map(([group, count]) => ({ group, count })),
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
