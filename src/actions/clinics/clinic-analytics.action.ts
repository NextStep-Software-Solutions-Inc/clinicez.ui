"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

/* ------------------------------------------------------------------ */
/*  Types exported for use in client components                        */
/* ------------------------------------------------------------------ */

export type GetClinicAnalytics = Awaited<ReturnType<typeof getClinicAnalyticsAction>>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLast6MonthRanges(): Array<{ label: string; start: Date; end: Date }> {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { label, start, end };
  });
}

/* ------------------------------------------------------------------ */
/*  Main action                                                        */
/* ------------------------------------------------------------------ */

export const getClinicAnalyticsAction = withErrorHandling(
  cache(async (clinicUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const clinic = await prisma.clinic.findFirst({
      where: { clinicUid, isActive: true },
      select: { id: true, clinicUid: true, name: true },
    });

    if (!clinic) throw new Error(`Clinic with UID ${clinicUid} not found`);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = startOfMonth(today);
    const lastMonthStart = startOfMonth(
      new Date(today.getFullYear(), today.getMonth() - 1, 1),
    );

    // Parallel fetch of all analytics data
    const [
      totalPatients,
      thisMonthPatients,
      lastMonthPatients,
      totalAppointments,
      thisMonthAppointments,
      lastMonthAppointments,
      totalConsultations,
      thisMonthConsultations,
      lastMonthConsultations,
      activeMembers,
      appointmentStatusCounts,
      appointmentModeCounts,
      appointmentTypeCounts,
      labRequestsCount,
      imagingRequestsCount,
      heartRequestsCount,
      referralSlipsCount,
      prescriptionsCount,
      medicalCertsCount,
      recentPatients,
      patientsLast6Months,
      appointmentsLast6Months,
      consultationsLast6Months,
    ] = await Promise.all([
      // ── Totals ─────────────────────────────────────────────────────
      prisma.clinicPatient.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.clinicPatient.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.clinicPatient.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.appointment.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.appointment.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.appointment.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.consultationTicket.count({
        where: { Clinic: { clinicUid }, isActive: true },
      }),
      prisma.consultationTicket.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.consultationTicket.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.clinicMember.count({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          status: "ACTIVE",
          deletedAt: null,
        },
      }),
      // ── Appointment status breakdown ───────────────────────────────
      prisma.appointmentAttribute.groupBy({
        by: ["status"],
        where: {
          Appointment: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
        },
        _count: { status: true },
      }),
      // ── Appointment mode distribution ──────────────────────────────
      prisma.appointmentAttribute.groupBy({
        by: ["modeId"],
        where: {
          Appointment: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
        },
        _count: { modeId: true },
        orderBy: { _count: { modeId: "desc" } },
        take: 5,
      }),
      // ── Appointment type distribution ──────────────────────────────
      prisma.appointmentAttribute.groupBy({
        by: ["typeId"],
        where: {
          Appointment: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
        },
        _count: { typeId: true },
        orderBy: { _count: { typeId: "desc" } },
        take: 5,
      }),
      // ── Diagnostic counts ──────────────────────────────────────────
      prisma.clinicLaboratoryRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.clinicImagingRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.clinicHeartStationRequest.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.clinicReferralSlip.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      prisma.prescription.count({
        where: { Clinic: { clinicUid }, isActive: true },
      }),
      prisma.clinicMedicalCertificate.count({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
      }),
      // ── Recent patients (for the table) ───────────────────────────
      prisma.clinicPatient.findMany({
        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
        select: {
          id: true,
          createdAt: true,
          Patient: {
            select: {
              firstName: true,
              lastName: true,
              gender: true,
              picture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // ── Monthly trend data (last 6 months) ────────────────────────
      prisma.clinicPatient.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
      prisma.appointment.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
      prisma.consultationTicket.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
    ]);

    // ── Resolve mode & type labels ──────────────────────────────────────
    const modeIds = appointmentModeCounts.map((m) => m.modeId);
    const typeIds = appointmentTypeCounts.map((t) => t.typeId);

    const [modes, types] = await Promise.all([
      modeIds.length
        ? prisma.appointmentMode.findMany({
            where: { id: { in: modeIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      typeIds.length
        ? prisma.appointmentType.findMany({
            where: { id: { in: typeIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const modeMap = new Map(modes.map((m) => [m.id, m.name]));
    const typeMap = new Map(types.map((t) => [t.id, t.name]));

    // ── Build monthly trend arrays ──────────────────────────────────────
    const monthRanges = getLast6MonthRanges();

    const monthlyTrends = monthRanges.map(({ label, start, end }) => ({
      month: label,
      patients: patientsLast6Months.filter(
        (p) => p.createdAt >= start && p.createdAt < end,
      ).length,
      appointments: appointmentsLast6Months.filter(
        (a) => a.createdAt >= start && a.createdAt < end,
      ).length,
      consultations: consultationsLast6Months.filter(
        (c) => c.createdAt >= start && c.createdAt < end,
      ).length,
    }));

    // ── Build status breakdown ──────────────────────────────────────────
    const statusBreakdown = appointmentStatusCounts.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    const totalAttributed = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
    const completedCount = statusBreakdown.find((s) => s.status === "COMPLETED")?.count ?? 0;
    const completionRate =
      totalAttributed > 0 ? Math.round((completedCount / totalAttributed) * 100) : 0;

    // ── Build mode/type distribution ────────────────────────────────────
    const modeDistribution = appointmentModeCounts.map((m) => ({
      name: modeMap.get(m.modeId) ?? `Mode ${m.modeId}`,
      count: m._count.modeId,
    }));

    const typeDistribution = appointmentTypeCounts.map((t) => ({
      name: typeMap.get(t.typeId) ?? `Type ${t.typeId}`,
      count: t._count.typeId,
    }));

    // ── Compute month-over-month trends ─────────────────────────────────
    function momTrend(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    return {
      message: "Clinic analytics data retrieved successfully",
      data: {
        clinic,
        overview: {
          totalPatients,
          thisMonthPatients,
          patientsTrend: momTrend(thisMonthPatients, lastMonthPatients),
          totalAppointments,
          thisMonthAppointments,
          appointmentsTrend: momTrend(thisMonthAppointments, lastMonthAppointments),
          totalConsultations,
          thisMonthConsultations,
          consultationsTrend: momTrend(thisMonthConsultations, lastMonthConsultations),
          activeMembers,
          completionRate,
        },
        monthlyTrends,
        appointmentBreakdown: {
          byStatus: statusBreakdown,
          byMode: modeDistribution,
          byType: typeDistribution,
        },
        diagnostics: {
          labRequests: labRequestsCount,
          imagingRequests: imagingRequestsCount,
          heartRequests: heartRequestsCount,
          referralSlips: referralSlipsCount,
          prescriptions: prescriptionsCount,
          medicalCertificates: medicalCertsCount,
        },
        recentPatients: recentPatients.map((p) => {
          const firstName = p.Patient.firstName?.trim() ?? "";
          const lastName = p.Patient.lastName?.trim() ?? "";
          const name = [firstName, lastName].filter(Boolean).join(" ") || "Unknown Patient";
          return {
            id: p.id,
            name,
            gender: p.Patient.gender ?? null,
            picture: p.Patient.picture ?? null,
            joinedAt: p.createdAt,
          };
        }),
      },
    };
  }),
);
