"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import dayjs from "@/lib/day-utils";

/**
 * Fetch comprehensive clinic dashboard data
 * Includes KPIs, schedule, workload, diagnostic requests, team status, and activity
 */
export type GetClinicDashboardData = Awaited<ReturnType<typeof getClinicDashboardDataAction>>;
export const getClinicDashboardDataAction = withErrorHandling(
    cache(async (clinicUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("User not authenticated");

        const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
        const myPermissionArray = myPermissions.map(p => p.name);
        const canViewDashboard = [PERMISSIONS.CLINIC["VIEW:CLINIC:DASHBOARD"].name].some(p => myPermissionArray.includes(p));
        if (!canViewDashboard) throw new Error("You do not have permission to view the clinic dashboard.");

        // Get clinic data
        const clinic = await prisma.clinic.findFirst({
            where: {
                clinicUid,
                isActive: true,
            },
            select: {
                id: true,
                clinicUid: true,
                name: true,
            },
        });

        if (!clinic) throw new Error(`Clinic with UID ${clinicUid} not found`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // PHT (Asia/Manila, UTC+8) day boundaries for DateTime fields such as completedAt
        const todayPHT = dayjs().tz("Asia/Manila").startOf("day").toDate();
        const tomorrowPHT = dayjs().tz("Asia/Manila").add(1, "day").startOf("day").toDate();

        // Fetch all metrics in parallel (10+ concurrent queries for performance)
        const [
            appointmentCount,
            patientCount,
            consultationCount,
            recentAppointments,
            recentClients,
            pendingAppointments,
            pendingRoutings,
            // Additional diagnostic requests
            referralSlipsCount,
            labRequestsCount,
            imagingRequestsCount,
            heartRequestsCount,
            // Workload metrics
            activeConsultations,
            upcomingAppointments,
            // Team metrics
            teamMembers,
            // KPI: Completed appointments today
            completedAppointmentsToday,
        ] = await Promise.all([
            // KPI: Appointment stats for today
            prisma.appointmentAttribute.count({
                where: {
                    Appointment: {
                        Clinic: { clinicUid },
                        isActive: true,
                        deletedAt: null,
                    },
                    date: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
            }),

            // KPI: Unique patients in clinic (today)
            prisma.clinicPatient.findMany({
                where: {
                    Clinic: { clinicUid },
                    createdAt: {
                        gte: today,
                    },
                },
                select: { id: true },
            }),

            // KPI: Consultation tickets (recent)
            prisma.consultationTicket.findMany({
                where: {
                    Clinic: { clinicUid },
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                },
                select: { id: true },
            }),

            // Activity: Recent appointments
            prisma.appointment.findMany({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    subject: true,
                    createdAt: true,
                    AppointmentAttribute: {
                        select: {
                            date: true,
                            timeStart: true,
                        },
                    },
                    Requesters: {
                        take: 1,
                        select: {
                            User: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
            }),

            // Activity: Recent clinic patients
            prisma.clinicPatient.findMany({
                where: {
                    Clinic: { clinicUid },
                },
                select: {
                    Patient: {
                        select: {
                            firstName: true,
                            lastName: true,
                            picture: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
            }),

            // KPI: Pending appointments (AppointmentAttribute status = PENDING)
            prisma.appointmentAttribute.count({
                where: {
                    Appointment: {
                        Clinic: { clinicUid },
                        isActive: true,
                        deletedAt: null,
                    },
                    status: "PENDING",
                },
            }),

            // KPI: Pending routing assignments (AppointmentRouting status = PENDING)
            prisma.appointmentRouting.count({
                where: {
                    Appointment: {
                        Clinic: { clinicUid },
                        isActive: true,
                        deletedAt: null,
                    },
                    status: "PENDING",
                },
            }),

            // Diagnostic: Referral slips count
            prisma.clinicReferralSlip.count({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    deletedAt: null,
                },
            }),

            // Diagnostic: Lab requests count
            prisma.clinicLaboratoryRequest.count({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    deletedAt: null,
                },
            }),

            // Diagnostic: Imaging requests count
            prisma.clinicImagingRequest.count({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    deletedAt: null,
                },
            }),

            // Diagnostic: Heart station requests count
            prisma.clinicHeartStationRequest.count({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    deletedAt: null,
                },
            }),

            // Workload: Active consultations (status = PROCESSING)
            prisma.consultationTicketAttribute.findMany({
                where: {
                    status: "PROCESSING",
                    ConsultationTicket: {
                        Clinic: { clinicUid },
                        isActive: true,
                    },
                },
                select: {
                    id: true,
                    status: true,
                    ConsultationTicket: {
                        select: {
                            id: true,
                            subject: true,
                            createdAt: true,
                        },
                    },
                },
                take: 10,
            }),

            // Schedule: Upcoming appointments (next 24 hours)
            prisma.appointmentAttribute.findMany({
                where: {
                    Appointment: {
                        Clinic: { clinicUid },
                        isActive: true,
                        deletedAt: null,
                    },
                    date: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
                select: {
                    Appointment: {
                        select: {
                            id: true,
                            subject: true,
                        },
                    },
                    date: true,
                    timeStart: true,
                    timeEnd: true,
                },
                orderBy: {
                    timeStart: "asc",
                },
                take: 5,
            }),

            // Team: Active members
            prisma.clinicMember.findMany({
                where: {
                    Clinic: { clinicUid },
                    isActive: true,
                    status: "ACTIVE",
                    deletedAt: null,
                },
                select: {
                    id: true,
                    User: {
                        select: {
                            firstName: true,
                            lastName: true,
                            picture: true,
                        },
                    },
                    Role: {
                        select: {
                            name: true,
                        },
                    },
                },
                take: 8,
            }),

            // KPI: Completed appointments today (filtered by actual completion time in PHT)
            prisma.appointmentAttribute.count({
                where: {
                    Appointment: {
                        Clinic: { clinicUid },
                        isActive: true,
                        deletedAt: null,
                    },
                    completedAt: {
                        gte: todayPHT,
                        lt: tomorrowPHT,
                    },
                },
            }),
        ]);

        return {
            message: "Clinic dashboard data retrieved successfully",
            data: {
                clinic,
                metrics: {
                    patientsToday: patientCount.length,
                    pendingAppointments,
                    pendingRoutings,
                    totalAppointmentsToday: appointmentCount,
                    totalConsultations: consultationCount.length,
                    completedAppointmentsToday,
                },
                diagnosticRequests: {
                    referrals: referralSlipsCount,
                    labRequests: labRequestsCount,
                    imagingRequests: imagingRequestsCount,
                    heartRequests: heartRequestsCount,
                },
                workload: {
                    activeConsultations: activeConsultations.length,
                    consultationDetails: activeConsultations.map((c) => ({
                        id: c.ConsultationTicket.id,
                        subject: c.ConsultationTicket.subject || "Ongoing Consultation",
                        createdAt: c.ConsultationTicket.createdAt,
                        status: c.status,
                    })),
                },
                schedule: {
                    upcomingCount: upcomingAppointments.length,
                    upcomingAppointments: upcomingAppointments.map((attr) => ({
                        id: attr.Appointment.id,
                        subject: attr.Appointment.subject,
                        date: attr.date,
                        timeStart: attr.timeStart,
                        timeEnd: attr.timeEnd,
                    })),
                },
                teamStatus: {
                    totalMembers: teamMembers.length,
                    members: teamMembers.map((member) => ({
                        id: member.id,
                        name: `${member.User.firstName} ${member.User.lastName}`,
                        role: member.Role.name,
                        avatar: member.User.picture,
                    })),
                },
                recentActivity: {
                    appointments: recentAppointments.map((apt) => ({
                        id: apt.id,
                        action: "New appointment booked",
                        detail: `${apt.subject}`,
                        detail2: apt.Requesters[0]?.User
                            ? `${apt.Requesters[0].User.firstName} ${apt.Requesters[0].User.lastName}`
                            : "Unknown",
                        time: apt.createdAt,
                        icon: "calendar",
                    })),
                    newPatients: recentClients.map((client) => ({
                        action: "New patient registered",
                        detail: `${client.Patient.firstName} ${client.Patient.lastName}`,
                        icon: "users",
                    })),
                },
            },
        };
    })
);
