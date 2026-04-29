"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type GetClinicExportData = Awaited<ReturnType<typeof getClinicExportDataAction>>;

export const getClinicExportDataAction = withErrorHandling(
  async ({
    clinicUid,
    from,
    to,
  }: {
    clinicUid: string;
    from: Date;
    to: Date;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map((p) => p.name);
    const canViewReports = [PERMISSIONS.CLINIC["VIEW:CLINIC:REPORTS"].name].some((p) =>
      myPermissionArray.includes(p)
    );
    if (!canViewReports) throw new Error("You do not have permission to view clinic reports.");

    const clinic = await prisma.clinic.findFirst({
      where: { clinicUid, isActive: true },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const dateFilter = { gte: from, lte: to };

    const [consultations, appointments] = await Promise.all([
      // ── Consultations with full details ─────────────────────────────────
      prisma.consultationTicket.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          createdAt: dateFilter,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          createdAt: true,
          System: { select: { name: true } },
          ConsultationTicketAttribute: { select: { status: true } },
          ConsultationNotes: {
            select: { section: true, content: true },
          },
          ConsultationTicketHPs: {
            select: {
              HealthCareProvider: {
                select: {
                  id: true,
                  User: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                      OrganizationMembers: {
                        select: {
                          OrganizationRole: { select: { name: true } },
                        },
                      },
                    },
                  },
                  HPProfile: {
                    select: {
                      name: true,
                      title: true,
                      suffix: true,
                      specialties: true,
                    },
                  },
                },
              },
            },
          },
          Appointment: {
            select: {
              id: true,
              complaint: true,
              Requesters: {
                select: {
                  User: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                      gender: true,
                      dob: true,
                      StudentRecords: {
                        select: {
                          Program: { select: { name: true } },
                          OrganizationYearLevel: { select: { name: true } },
                        },
                      },
                      OrganizationMembers: {
                        select: {
                          OrganizationRole: { select: { name: true } },
                          Organization: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
              PreAssessmentNotes: {
                orderBy: { createdAt: "desc" },
                select: {
                  assessment: true,
                  CreatedBy: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                      OrganizationMembers: {
                        select: {
                          OrganizationRole: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
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
                  ReceivedBy: {
                    select: {
                      firstName: true,
                      lastName: true,
                      OrganizationMembers: {
                        select: {
                          OrganizationRole: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // ── Appointments with full details ───────────────────────────────────
      prisma.appointment.findMany({
        where: {
          Clinic: { clinicUid },
          isActive: true,
          deletedAt: null,
          createdAt: dateFilter,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          complaint: true,
          createdAt: true,
          Requesters: {
            select: {
              User: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  gender: true,
                  dob: true,
                  StudentRecords: {
                    select: {
                      Program: { select: { name: true } },
                      OrganizationYearLevel: { select: { name: true } },
                    },
                  },
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: { select: { name: true } },
                      Organization: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
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
          AppointmentRouting: {
            select: {
              status: true,
              RoutedTo: {
                select: {
                  HPProfile: { select: { title: true, name: true, suffix: true } },
                  User: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                    },
                  },
                },
              },
            },
          },
          ConsultationTickets: {
            select: { id: true },
          },
        },
      }),
    ]);

    return { message: "Report data fetched successfully", data: { consultations, appointments } };
  }
);
