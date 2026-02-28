"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

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

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canViewReports = [PERMISSIONS.CLINIC["VIEW:CLINIC:REPORTS"].name].some(p => myPermissionArray.includes(p));
    if (!canViewReports) throw new Error("You do not have permission to view clinic reports.");

    const clinic = await prisma.clinic.findFirst({
      where: { clinicUid, isActive: true },
      select: { id: true, name: true, clinicUid: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const dateFilter = { gte: from, lte: to };

    const [
      appointments,
      consultations,
      // Patient counts
      newPatients,
      totalPatients,
      // Patient demographic data (all-time clinic patients)
      patientDemographics,
      // Top health conditions of clinic patients
      healthConditions,
      // Top allergies of clinic patients
      allergies,
      // Profile completion breakdown
      profileCompletion,
      // Diagnostics counts
      prescriptions,
      labRequests,
      imagingRequests,
      heartRequests,
      medicalCertificates,
      referralSlips,
      // Staff: clinic members by role
      clinicMembers,
      // Staff: prescriptions per HP in period
      prescriptionsByHp,
      // Staff: lab requests per HP in period
      labByHp,
      // Staff: imaging requests per HP in period
      imagingByHp,
      // Staff: med certs per HP in period
      medCertsByHp,
      // Service utilization: procedure usage history in period
      procedureUsage,
    ] = await Promise.all([
      // ── Appointments ─────────────────────────────────────────────────
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

      // ── Consultations ─────────────────────────────────────────────────
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

      // ── Patient counts ─────────────────────────────────────────────────
      prisma.clinicPatient.count({
        where: { Clinic: { clinicUid }, createdAt: dateFilter },
      }),
      prisma.clinicPatient.count({
        where: { Clinic: { clinicUid }, isActive: true },
      }),

      // ── Patient demographics (all active clinic patients) ────────────
      prisma.clinicPatient.findMany({
        where: { Clinic: { clinicUid }, isActive: true },
        select: {
          createdAt: true,
          Patient: {
            select: {
              gender: true,
              dob: true,
              civilStatus: true,
              bloodType: true,
              accountType: true,
            },
          },
        },
      }),

      // ── Top health conditions of clinic patients ─────────────────────
      prisma.userHealthCondition.findMany({
        where: {
          User: {
            ClinicPatients: {
              some: { Clinic: { clinicUid }, isActive: true },
            },
          },
        },
        select: {
          HealthCondition: { select: { name: true } },
          severity: true,
        },
      }),

      // ── Top allergies of clinic patients ─────────────────────────────
      prisma.userAllergy.findMany({
        where: {
          User: {
            ClinicPatients: {
              some: { Clinic: { clinicUid }, isActive: true },
            },
          },
        },
        select: {
          Allergen: { select: { name: true } },
          reaction: true,
        },
      }),

      // ── Profile completion breakdown ──────────────────────────────────
      prisma.clinicPatient.groupBy({
        by: ["profileCompletionStatus"],
        where: { Clinic: { clinicUid }, isActive: true },
        _count: { id: true },
      }),

      // ── Diagnostics counts ────────────────────────────────────────────
      prisma.prescription.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicLaboratoryRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicImagingRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicHeartStationRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicMedicalCertificate.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),
      prisma.clinicReferralSlip.count({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
      }),

      // ── Staff: clinic members by role ─────────────────────────────────
      prisma.clinicMember.findMany({
        where: { Clinic: { clinicUid }, isActive: true },
        select: {
          Role: { select: { name: true } },
          User: { select: { firstName: true, lastName: true } },
        },
      }),

      // ── Staff: prescriptions per HP in period ─────────────────────────
      prisma.prescription.findMany({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
        select: {
          HealthcareProvider: {
            select: {
              HPProfile: { select: { name: true } },
              User: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // ── Staff: lab requests per HP in period ──────────────────────────
      prisma.clinicLaboratoryRequest.findMany({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
        select: {
          HealthCareProvider: {
            select: {
              HPProfile: { select: { name: true } },
              User: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // ── Staff: imaging requests per HP in period ──────────────────────
      prisma.clinicImagingRequest.findMany({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
        select: {
          HealthCareProvider: {
            select: {
              HPProfile: { select: { name: true } },
              User: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // ── Staff: medical certificates per HP in period ──────────────────
      prisma.clinicMedicalCertificate.findMany({
        where: { Clinic: { clinicUid }, isActive: true, createdAt: dateFilter },
        select: {
          HealthCareProvider: {
            select: {
              HPProfile: { select: { name: true } },
              User: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // ── Service utilization: procedure usage history ──────────────────
      prisma.procedureUsageHistory.findMany({
        where: { Clinic: { clinicUid }, usedAt: dateFilter },
        select: { procedureType: true, procedureName: true },
      }),
    ]);

    // ── Process appointment stats ─────────────────────────────────────────
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
      const category = apt.AppointmentAttribute?.Service?.ServiceCategory?.name ?? "Unknown";
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

    // ── Process consultation stats ────────────────────────────────────────
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

    // ── Process patient demographics ──────────────────────────────────────
    const genderCounts: Record<string, number> = {};
    const civilStatusCounts: Record<string, number> = {};
    const bloodTypeCounts: Record<string, number> = {};
    const accountTypeCounts: Record<string, number> = {};
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
    const registrationsByMonth: Record<string, number> = {};

    const now = new Date();
    for (const cp of patientDemographics) {
      const p = cp.Patient;

      const g = p.gender ?? "Unknown";
      genderCounts[g] = (genderCounts[g] ?? 0) + 1;

      const cs = p.civilStatus ?? "Unknown";
      civilStatusCounts[cs] = (civilStatusCounts[cs] ?? 0) + 1;

      const bt = p.bloodType ?? "Unknown";
      bloodTypeCounts[bt] = (bloodTypeCounts[bt] ?? 0) + 1;

      const at = p.accountType ?? "Unknown";
      accountTypeCounts[at] = (accountTypeCounts[at] ?? 0) + 1;

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

      // Monthly registrations (all time, last 12 months)
      const monthKey = cp.createdAt.toISOString().slice(0, 7); // YYYY-MM
      registrationsByMonth[monthKey] = (registrationsByMonth[monthKey] ?? 0) + 1;
    }

    // ── Process health conditions ─────────────────────────────────────────
    const conditionCounts: Record<string, number> = {};
    for (const hc of healthConditions) {
      const name = hc.HealthCondition.name;
      conditionCounts[name] = (conditionCounts[name] ?? 0) + 1;
    }

    // ── Process allergies ─────────────────────────────────────────────────
    const allergyCounts: Record<string, number> = {};
    for (const a of allergies) {
      const name = a.Allergen.name;
      allergyCounts[name] = (allergyCounts[name] ?? 0) + 1;
    }

    // ── Process staff activity ────────────────────────────────────────────
    const membersByRole: Record<string, number> = {};
    for (const m of clinicMembers) {
      const role = m.Role.name;
      membersByRole[role] = (membersByRole[role] ?? 0) + 1;
    }

    const hpName = (hp: {
      HPProfile: { name: string } | null;
      User: { firstName: string | null; lastName: string | null };
    }) =>
      hp.HPProfile?.name ??
      (`${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim() || "Unknown");

    const rxByHp: Record<string, number> = {};
    for (const p of prescriptionsByHp) {
      if (p.HealthcareProvider) {
        const n = hpName(p.HealthcareProvider);
        rxByHp[n] = (rxByHp[n] ?? 0) + 1;
      }
    }

    const labByHpCounts: Record<string, number> = {};
    for (const l of labByHp) {
      if (l.HealthCareProvider) {
        const n = hpName(l.HealthCareProvider);
        labByHpCounts[n] = (labByHpCounts[n] ?? 0) + 1;
      }
    }

    const imagingByHpCounts: Record<string, number> = {};
    for (const i of imagingByHp) {
      if (i.HealthCareProvider) {
        const n = hpName(i.HealthCareProvider);
        imagingByHpCounts[n] = (imagingByHpCounts[n] ?? 0) + 1;
      }
    }

    const medCertsByHpCounts: Record<string, number> = {};
    for (const mc of medCertsByHp) {
      if (mc.HealthCareProvider) {
        const n = hpName(mc.HealthCareProvider);
        medCertsByHpCounts[n] = (medCertsByHpCounts[n] ?? 0) + 1;
      }
    }

    // Aggregate per HP: total documents produced
    const allHpNames = new Set([
      ...Object.keys(rxByHp),
      ...Object.keys(labByHpCounts),
      ...Object.keys(imagingByHpCounts),
      ...Object.keys(medCertsByHpCounts),
      ...Object.keys(hpConsultationCounts),
    ]);

    const hpActivity = Array.from(allHpNames)
      .map((name) => ({
        name,
        consultations: hpConsultationCounts[name] ?? 0,
        prescriptions: rxByHp[name] ?? 0,
        labRequests: labByHpCounts[name] ?? 0,
        imagingRequests: imagingByHpCounts[name] ?? 0,
        medicalCertificates: medCertsByHpCounts[name] ?? 0,
        total:
          (hpConsultationCounts[name] ?? 0) +
          (rxByHp[name] ?? 0) +
          (labByHpCounts[name] ?? 0) +
          (imagingByHpCounts[name] ?? 0) +
          (medCertsByHpCounts[name] ?? 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // ── Process service/procedure utilization ────────────────────────────
    const procedureTypeCounts: Record<string, number> = {};
    const procedureNameCounts: Record<string, { count: number; type: string }> = {};
    for (const pu of procedureUsage) {
      const t = pu.procedureType;
      procedureTypeCounts[t] = (procedureTypeCounts[t] ?? 0) + 1;
      if (!procedureNameCounts[pu.procedureName]) {
        procedureNameCounts[pu.procedureName] = { count: 0, type: t };
      }
      procedureNameCounts[pu.procedureName].count++;
    }

    // Keep last 12 months of registration trend
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d.toISOString().slice(0, 7);
    });
    const registrationTrend = last12Months.map((month) => ({
      month,
      count: registrationsByMonth[month] ?? 0,
    }));

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
            .map(([service, { count, category }]) => ({ service, count, category }))
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
          byGender: Object.entries(genderCounts)
            .map(([gender, count]) => ({ gender, count }))
            .sort((a, b) => b.count - a.count),
          byCivilStatus: Object.entries(civilStatusCounts)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
          byBloodType: Object.entries(bloodTypeCounts)
            .map(([type, count]) => ({ type, count }))
            .filter((x) => x.type !== "Unknown")
            .sort((a, b) => b.count - a.count),
          byAgeGroup: Object.entries(ageGroupCounts)
            .filter(([, c]) => c > 0)
            .map(([group, count]) => ({ group, count })),
          byAccountType: Object.entries(accountTypeCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count),
          byProfileCompletion: profileCompletion.map((pc) => ({
            status: pc.profileCompletionStatus,
            count: pc._count.id,
          })),
          topConditions: Object.entries(conditionCounts)
            .map(([condition, count]) => ({ condition, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          topAllergies: Object.entries(allergyCounts)
            .map(([allergen, count]) => ({ allergen, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          registrationTrend,
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
        staff: {
          totalMembers: clinicMembers.length,
          byRole: Object.entries(membersByRole)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count),
          hpActivity,
        },
        services: {
          totalProcedures: procedureUsage.length,
          byType: Object.entries(procedureTypeCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count),
          topProcedures: Object.entries(procedureNameCounts)
            .map(([name, { count, type }]) => ({ name, count, type }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15),
        },
      },
    };
  }
);
