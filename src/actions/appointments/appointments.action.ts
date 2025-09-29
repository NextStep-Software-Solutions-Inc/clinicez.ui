"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { cache } from "react";
import dayjs from "@lib/day-utils";
import { AppointmentStatus, RoutedAptStatus } from "@public/json/appointment-list";
import { PERMISSIONS } from "@lib/permissions";
import { hasCodeProperty } from "@lib/utils";
import { getHPsAction } from "@actions/hp.actions";
import path from "path";
import fs from "fs/promises";
import { sendMail } from "@actions/email.action";
import { withErrorHandling } from "@/lib/with-error-handling";

type CreateAppointmentPayload = {
  clinicUid: string;
  subject: string;
  complaint?: string;
  modeId: number;
  typeId: number;
  serviceId: number;
  requesters: string[];
  attachments: string[];
  hpId?: number;
  schedule?: {
    date?: Date;
    timeStart?: string;
    timeEnd?: string;
  };
};
export const createAppointmentAction = withErrorHandling(async (payload: CreateAppointmentPayload) => {

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, subject, complaint, requesters, modeId, typeId, serviceId, attachments, hpId, schedule } = payload;
  const { date, timeStart, timeEnd } = schedule ?? {};

  // Input validation
  if (!clinicUid || !subject || !requesters || requesters.length === 0) {
    throw new Error("Missing required appointment data");
  }

  if (requesters.some(r => !r || typeof r !== 'string')) {
    throw new Error("Invalid requester data provided");
  }

  const createAppointmentPermissions = [PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT"].name];
  const bookAFriendPermissions = [PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT:BOOK_A_FRIEND"].name];
  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const userPermissionArray = myPermissions.map(p => p.name);
  const canCreateAppointment = createAppointmentPermissions.every(p => userPermissionArray.includes(p));
  const canBookAFriend = bookAFriendPermissions.every(p => userPermissionArray.includes(p));

  if (!canCreateAppointment) throw new Error("You do not have permission to create an appointment in this organization");
  if (requesters.some((requester) => requester !== session.user.sub) && !canBookAFriend) throw new Error("You cannot book an appointment for another user");

  const newAppointment = await prisma.$transaction(async (prisma) => {
    const numberOfAppointments = await prisma.appointment.count({
      where: {
        Clinic: {
          clinicUid
        },
        createdAt: {
          // today only
          gte: dayjs().startOf("day").toDate(),
        },
        AppointmentAttribute: {
          status: "PENDING"
        },
        Requesters: {
          some: {
            User: {
              userId: {
                in: requesters
              }
            }
          }
        }
      }
    });
    const maxNumberOfAppointment = await prisma.appointmentConfig.findFirstOrThrow({
      where: {
        Clinic: {
          clinicUid
        }
      },
      select: {
        maxAppointmentsPerClient: true,
        maxAppointmentsPerDay: true
      }
    })
    if (numberOfAppointments >= maxNumberOfAppointment.maxAppointmentsPerClient) throw new Error("You have reached the maximum number of appointments you can book for today");

    if (numberOfAppointments >= maxNumberOfAppointment.maxAppointmentsPerDay) throw new Error("The appointments quota of the organization for today has been reached");

    // Batch fetch users, clinic, and role data for better performance
    const [patientUsers, clinic, patientRole] = await Promise.all([
      prisma.user.findMany({
        where: {
          userId: { in: requesters },
          isActive: true
        },
        select: { id: true, userId: true }
      }),
      prisma.clinic.findUnique({
        where: { clinicUid },
        select: { id: true }
      }),
      prisma.clinicRole.findFirst({
        where: {
          name: { equals: "Patient", mode: "insensitive" }
        },
        select: { id: true }
      })
    ]);

    // Validate required data
    if (!clinic) throw new Error("Clinic not found");
    if (patientUsers.length === 0) throw new Error("No valid users found for appointment requesters");
    if (patientUsers.length !== requesters.length) {
      throw new Error("Some requester accounts are invalid or inactive");
    }

    // Get role permissions for the specific clinic (if patient role exists)
    const rolePermissions = patientRole ? await prisma.clinicRoleInitialPermission.findMany({
      where: {
        Clinic: { clinicUid },
        clinicRoleId: patientRole.id
      },
      select: { permissionId: true }
    }) : [];

    // Check which users are already ClinicPatients to avoid unnecessary operations
    const existingClinicPatients = await prisma.clinicPatient.findMany({
      where: {
        clinicId: clinic.id,
        Patient: {
          userId: { in: patientUsers.map(user => user.userId) }
        }
      },
      select: { Patient: { select: { userId: true } } }
    });

    const existingPatientUserIds = new Set(
      existingClinicPatients.map(cp => cp.Patient.userId)
    );

    // Filter users who need ClinicPatient records created
    const usersNeedingClinicPatient = patientUsers.filter(
      user => !existingPatientUserIds.has(user.userId)
    );

    // Batch create ClinicPatient records for new patients only
    if (usersNeedingClinicPatient.length > 0) {
      console.log(`Creating ClinicPatient records for ${usersNeedingClinicPatient.length} new patients in clinic ${clinicUid}`);

      try {
        const clinicPatientData = usersNeedingClinicPatient.map(user => ({
          clinicId: clinic.id,
          patientId: user.id
        }));

        // Use createMany for better performance with batch inserts
        await prisma.clinicPatient.createMany({
          data: clinicPatientData,
          skipDuplicates: true // Additional safety net
        });

        // If we have role permissions, assign them to newly created ClinicPatients
        if (rolePermissions.length > 0) {
          // Get the newly created ClinicPatient IDs
          const newClinicPatients = await prisma.clinicPatient.findMany({
            where: {
              clinicId: clinic.id,
              Patient: {
                userId: { in: usersNeedingClinicPatient.map(user => user.userId) }
              }
            },
            select: { id: true }
          });

          // Batch create permissions for all new ClinicPatients
          const permissionData = newClinicPatients.flatMap(clinicPatient =>
            rolePermissions.map(permission => ({
              clinicPatientId: clinicPatient.id,
              permissionId: permission.permissionId
            }))
          );

          if (permissionData.length > 0) {
            await prisma.clinicPatientPermission.createMany({
              data: permissionData,
              skipDuplicates: true
            });
            console.log(`Assigned ${permissionData.length} permissions to new ClinicPatient records`);
          }
        }

        console.log(`Successfully created ${usersNeedingClinicPatient.length} ClinicPatient records`);
      } catch (error) {
        // Enhanced error handling with specific error messages
        console.error("Error creating ClinicPatient records:", error);

        if (hasCodeProperty(error)) {
          switch (error.code) {
          case "P2002": // Unique constraint violation
            console.warn("Some ClinicPatient records already exist, continuing...");
            break;
          case "P2003": // Foreign key constraint violation
            throw new Error("Invalid clinic or patient data provided");
          case "P2025": // Record not found
            throw new Error("Required clinic or user data not found");
          default:
            throw new Error(`Database error while creating patient records: ${error.code}`);
          }
        } else {
          throw new Error("Failed to create clinic patient records");
        }
      }
    } else {
      console.log(`All ${patientUsers.length} users are already ClinicPatients in clinic ${clinicUid}`);
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        subject,
        complaint,
        Clinic: {
          connect: {
            clinicUid,
          }
        },
        AppointmentAttribute: {
          create: {
            preferredAppointee: hpId,
            modeId,
            typeId,
            serviceId,
            timeStart,
            timeEnd,
            date: date
          }
        },
        Requesters: {
          createMany: {
            data: patientUsers.map((user) => ({ userId: user.id })),
            skipDuplicates: true
          }
        },
        AppointmentAttachments: {
          createMany: {
            data: attachments.map((url) => ({
              name: url.split("/").pop() ?? url,
              url
            })),
            skipDuplicates: true
          }
        }
      },
      select: {
        Clinic: {
          select: {
            name: true,
            email: true
          }
        },
        Requesters: {
          select: {
            User: {
              select: {
                email: true,
                firstName: true,
                middleName: true,
                lastName: true,
                suffix: true
              }
            }
          }
        }
      }
    })
    return newAppointment;
  }, {
    timeout: 10000, // 10 second timeout
    maxWait: 15000, // Maximum wait time
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  });

  const mappedUsers = newAppointment.Requesters
    .filter(requester => requester.User) // Filter out requesters with missing User data
    .map((requester) => ({
      fullName: `${requester.User.firstName} ${requester.User.middleName ?? ""} ${requester.User.lastName ?? ""} ${requester.User.suffix ?? ""}`.trim(),
      email: requester.User.email,
      organization: newAppointment.Clinic.name,
      orgMail: newAppointment.Clinic.email ?? ""
    }))

  if (mappedUsers.length > 0) {
    await sendAppointmentRequestSent({ users: mappedUsers });
  } else {
    console.warn("Skipping email notification - no valid users found");
  }

  return { message: "Appointment created", data: newAppointment };
});

export type GetAppointmentFilter = {
  clinicUid?: string;
  userId?: string;
  status?: AppointmentStatus;
  routedAptStatus?: RoutedAptStatus;
  appointmentId?: number;
  sort?: "request" | "schedule";
};
export type GetAppointments = Awaited<ReturnType<typeof getAppointmentsAction>>;
export const getAppointmentsAction = withErrorHandling(cache(async (filter?: GetAppointmentFilter) => {

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const [permissions, myHps] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub }),
    getHPsAction({ userId: session.user.sub })
  ])

  const { clinicUid, userId, status, routedAptStatus, sort } = filter || {};

  const userPermissionArray = permissions.map(p => p.name);

  const readAllOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name];
  const readAOwnOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name];
  const readAssignedOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name];

  const canReadAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))


  const myHpIds = myHps.map((hp) => hp.id);
  const appointments = await prisma.appointment.findMany({
    orderBy: {
      ...(sort === "schedule"
        ? {
          AppointmentAttribute: {
            date: "asc",
          }
        }
        : { createdAt: "desc" })
    },
    where: {
      Clinic: {
        clinicUid
      },
      isActive: true,
      AppointmentAttribute: { ...(status !== "ALL" ? { status } : {}) },
      ...(routedAptStatus
        ? {
          AppointmentRouting: {
            some: {
              status: routedAptStatus
            },
          }
        }
        : {}),
      OR: [
        { ...(canReadAllOrgAppointment ? { Clinic: { clinicUid }, ...userId ? { Requesters: { every: { User: { userId } } } } : {} } : {}) },
        { ...(canReadAOwnOrgAppointment ? { Requesters: { every: { User: { userId: session.user.sub } } } } : {}) },
        {
          ...(canReadAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  {
                    routedTo: {
                      in: myHpIds
                    }
                  },
                  { RoutedBy: { userId: session.user.sub } }
                ]
              }
            }
          } : {})
        },
      ]
    },
    select: {
      id: true,
      clinicId: true,
      subject: true,
      complaint: true,
      createdAt: true,
      updatedAt: true,
      Requesters: {
        select: {
          User: {
            select: {
              userId: true,
              StudentRecords: true,
              UserEmployments: true,
            }
          }
        }
      },
      _count: {
        select: {
          ConsultationTickets: true
        }
      },
      AppointmentAttribute: {
        select: {
          date: true,
          timeStart: true,
          completedAt: true,
          receivedAt: true,
          rejectedAt: true,
          rescheduledAt: true,
          AppointmentType: {
            select: {
              name: true
            }
          },
          AppointmentMode: {
            select: {
              name: true
            }
          },
          preferredAppointee: true,
          status: true,
          Service: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // whitelist filter
  const [myWhitelistFilter] = await Promise.all([
    getUserWhitelistFilters(session.user.sub, clinicUid)
  ])

  const filteredAppointments = appointments.filter((apt) => {
    // Skip whitelist filtering if there are no whitelist filters
    const whitelistFilters = myWhitelistFilter.data?.WhitelistFilters ?? [];
    if (whitelistFilters.length === 0) {
      return true; // No filters means all appointments are allowed
    }

    // Skip this appointment only if it has requesters but no user data (corrupted data)
    if (apt?.Requesters?.length && !apt.Requesters[0]?.User) {
      return false; // Has requesters but missing user data - filter out
    }

    // If appointment has no requesters at all, keep it (might be valid system appointment)
    if (!apt?.Requesters?.length) {
      return true;
    }

    return whitelistFilters.every((filter) => {
      return isFilterMatch(filter.Filter.key, filter.value, apt.Requesters[0].User);
    });
  });

  return { message: "Appointments fetched", data: filteredAppointments };
}));

export type GetAppointment = Awaited<ReturnType<typeof getAppointmentAction>>;
export const getAppointmentAction = withErrorHandling(cache(async (id: number, clinicUid: string) => {

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const permissions = await getPermissionsAction({ userId: session.user.sub });
  const userPermissionArray = permissions.map(p => p.name);

  const readAllOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name]; // read all appointments in the org
  const readAOwnOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name]; // read appointments that the user is a requester
  const readAssignedOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name]; // read appointments that the user is assigned to or assigned by

  const canReadAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))

  const appointment = await prisma.appointment.findUnique({
    where: {
      isActive: true,
      OR: [
        { ...(canReadAllOrgAppointment ? { Clinic: { clinicUid }, id } : {}) },
        { ...(canReadAOwnOrgAppointment ? { Requesters: { some: { User: { userId: session.user.sub } } }, id } : {}) },
        {
          ...(canReadAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  {
                    RoutedTo: {
                      User: {
                        userId: session.user.sub
                      }
                    }
                  },
                  {
                    RoutedBy: {
                      userId: session.user.sub
                    }
                  }
                ]
              }
            },
            id
          } : {})
        },
      ],
      id
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      Requesters: {
        select: {
          User: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
              gender: true,
              picture: true,
              nickname: true,
              dob: true,
              ClinicPatients: {
                select: {
                  id: true,
                },
                take: 1,
              },
              UserAddresses: {
                where: {
                  isPrimary: true,
                  isActive: true,
                },
                select: {
                  address: true,
                  city: true,
                  state: true,
                  zipCode: true,
                  country: true,
                },
                take: 1,
              }
            }
          }
        }
      },
      clinicId: true,
      AppointmentAttachments: {
        select: {
          id: true,
          url: true
        }
      },
      AppointmentAttribute: {
        select: {
          date: true,
          timeStart: true,
          timeEnd: true,
          eventId: true,
          meetingUrl: true,
          AppointmentType: {
            select: {
              id: true,
              name: true
            }
          },
          AppointmentMode: {
            select: {
              name: true
            }
          },
          status: true,
          Service: {
            select: {
              id: true,
              name: true
            }
          },
          receivedAt: true,
          ReceivedBy: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            }
          },
          rejectedAt: true,
          RejectedBy: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            }
          },
          completedAt: true,
          CompletedBy: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            }
          },
          PreferredAppointee: {
            select: {
              id: true,
              User: {
                select: {
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                }
              },
              HPProfile: {
                select: {
                  title: true,
                  name: true,
                  suffix: true,
                  fields: true
                }
              }
            }
          },
          rejectedReason: true,
        }
      },
      AppointmentRouting: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          routingCode: true,
          amendment: true,
          RoutedBy: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            }
          },
          RoutedTo: {
            select: {
              id: true,
              hpTypeId: true,
              HPProfile: {
                select: {
                  id: true,
                  title: true,
                  name: true,
                  suffix: true,
                  fields: true
                }
              },
              User: {
                select: {
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                }
              },
            }
          },
          status: true,
          updatedAt: true
        }
      },
      PreAssessmentNotes: {
        where: {
          appointmentId: id,
          Clinic: {
            clinicUid
          }
        },
        select: {
          id: true,
          assessment: true,
          remarks: true,
          homeInstructions: true,
          CreatedBy: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            }
          },
          PreAssessmentNoteAttribute: {}
        }
      },
      ConsultationTickets: {
        where: {
          appointmentId: id,
          Clinic: {
            clinicUid
          }
        },
        select: {
          id: true,
          updatedAt: true,
          ConsultationTicketHPs: true,
          subject: true,
          ConsultationTicketAttribute: {
            select: {
              NoteTemplate: true
            }
          }
        }
      }
    }
  });

  return { message: "Appointment fetched", data: appointment };
}));

export type GetAppointmentCounts = Awaited<ReturnType<typeof getAppointmentCountsAction>>;
export const getAppointmentCountsAction = withErrorHandling(cache(async (clinicUid: string) => {

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const [permissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub }),
  ])

  const userPermissionArray = permissions.map(p => p.name);

  const readAllOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name];
  const readAOwnOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name];
  const readAssignedOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name];

  const canReadAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))

  const appointments = await prisma.appointment.findMany({
    where: {
      isActive: true,
      OR: [
        { ...(canReadAllOrgAppointment ? { Clinic: { clinicUid } } : {}) },
        { ...(canReadAOwnOrgAppointment ? { Requesters: { every: { User: { userId: session.user.sub } } } } : {}) },
        {
          ...(canReadAssignedOrgAppointment ? {
            AppointmentRouting: {
              every: {
                OR: [
                  {
                    RoutedTo: {
                      User: {
                        userId: session.user.sub
                      }
                    }
                  },
                  {
                    RoutedBy: {
                      userId: session.user.sub
                    }
                  }
                ]
              }
            }
          } : {})
        },
      ]
    },
    select: {
      AppointmentAttribute: {
        select: {
          status: true
        }
      },
      Requesters: {
        select: {
          User: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              StudentRecords: true,
              UserEmployments: true
            }
          }
        }
      },
    }
  });


  const [myWhitelistFilter] = await Promise.all([
    getUserWhitelistFilters(session.user.sub, clinicUid)
  ])

  const filteredAppointments = appointments.filter((apt) => {
    // Skip whitelist filtering if there are no whitelist filters
    const whitelistFilters = myWhitelistFilter.data?.WhitelistFilters ?? [];
    if (whitelistFilters.length === 0) {
      return true; // No filters means all appointments are allowed
    }

    // Skip this appointment only if it has requesters but no user data (corrupted data)
    if (apt?.Requesters?.length && !apt.Requesters[0]?.User) {
      return false; // Has requesters but missing user data - filter out
    }

    // If appointment has no requesters at all, keep it (might be valid system appointment)
    if (!apt?.Requesters?.length) {
      return true;
    }

    return whitelistFilters.every((filter) => {
      return isFilterMatch(filter.Filter.key, filter.value, apt.Requesters[0].User);
    });
  });

  // group by status
  const countsMap = filteredAppointments.reduce((acc, apt) => {
    const status = apt?.AppointmentAttribute?.status;
    if (status) acc[status] = (acc[status] ?? 0) + 1;
    acc["ALL"] += 1;
    return acc;
  }, { ALL: 0 } as Record<string, number>);

  return { message: "Appointment counts fetched", data: countsMap };
}));

export const getRoutedAppointmentCountsAction = withErrorHandling(cache(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const [permissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub }),
  ])
  const userPermissionArray = permissions.map(p => p.name);

  const readAllOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name];
  const readAOwnOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name];
  const readAssignedOrgAppointmentPermission = [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name];

  const canReadAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const canReadAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))

  const routedAppointments = await prisma.appointmentRouting.findMany({
    distinct: ["appointmentId", "status"],
    where: {
      Appointment: {
        isActive: true,
        AppointmentAttribute: {
          status: {
            in: ["ROUTED"]
          }
        },
        OR: [
          { ...(canReadAllOrgAppointment ? { Clinic: { clinicUid } } : {}) },
          { ...(canReadAOwnOrgAppointment ? { Requesters: { every: { User: { userId: session.user.sub } } } } : {}) },
          {
            ...(canReadAssignedOrgAppointment ? {
              AppointmentRouting: {
                some: {
                  OR: [
                    {
                      RoutedTo: {
                        User: {
                          userId: session.user.sub
                        }
                      }
                    },
                    {
                      RoutedBy: {
                        userId: session.user.sub
                      }
                    }
                  ]
                }
              }
            } : {})
          },
        ]
      }
    },
    select: {
      status: true,
      Appointment: {
        select: {
          Requesters: {
            select: {
              User: {
                select: {
                  userId: true,
                  StudentRecords: true,
                  UserEmployments: true
                }
              }
            }
          },

        }
      }
    }
  });


  const [myWhitelistFilter] = await Promise.all([
    getUserWhitelistFilters(session.user.sub, clinicUid)
  ])

  const filteredAppointments = routedAppointments.filter((routed) => {
    // Skip whitelist filtering if there are no whitelist filters
    const whitelistFilters = myWhitelistFilter.data?.WhitelistFilters ?? [];
    if (whitelistFilters.length === 0) {
      return true; // No filters means all appointments are allowed
    }

    // Skip this appointment only if it has requesters but no user data (corrupted data)
    if (routed.Appointment?.Requesters?.length && !routed.Appointment.Requesters[0]?.User) {
      return false; // Has requesters but missing user data - filter out
    }

    // If appointment has no requesters at all, keep it (might be valid system appointment)
    if (!routed.Appointment?.Requesters?.length) {
      return true;
    }

    return whitelistFilters.every((filter) => {
      return isFilterMatch(filter.Filter.key, filter.value, routed.Appointment.Requesters[0].User);
    });
  });

  const countsMap = filteredAppointments.reduce((acc, routed) => {
    const status = routed.status;
    if (status) acc[status] = (acc[status] ?? 0) + 1;
    acc["ALL"] += 1;
    return acc;
  }, { ALL: 0 } as Record<string, number>);

  return { message: "Appointment counts fetched", data: countsMap };
}));

type RescheduleAppointmentPayload = {
  appointmentId: number;
  startDateTime: string;
  endDateTime: string;
  date: string;
  hpId: number;
  assign: boolean;
};
export const rescheduleAppointmentAction = withErrorHandling(async ({ appointmentId, startDateTime, endDateTime, date, hpId, assign }: RescheduleAppointmentPayload) => {

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.appointmentAttribute.update({
        where: {
          appointmentId,
          Appointment: {
            isActive: true
          }
        },
        data: {
          date: dayjs(date).endOf("day").toDate(),
          timeStart: startDateTime,
          timeEnd: endDateTime,
          rescheduledAt: new Date(),
          RescheduledBy: {
            connect: {
              userId: session.user.sub
            }
          },
          ...(assign ? { status: "ROUTED" } : {})
        }
      });
      if (assign) {
        await prisma.appointmentRouting.create({
          data: {
            Appointment: {
              connect: {
                id: appointmentId,
              }
            },
            RoutedBy: {
              connect: {
                userId: session.user.sub
              }
            },
            RoutedTo: {
              connect: {
                id: hpId
              }
            },
            status: "PENDING"
          }
        });
      }
    }, {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
    return { message: "Appointment rescheduled", data: undefined }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2025") {
      throw new Error("Appointment not found or you are not authorized to reschedule it");
    }
    throw new Error("Failed to reschedule appointment");
  }
});

const getUserWhitelistFilters = withErrorHandling(async (userId: string, clinicUid?: string) => {
  const appointmentWhitelist = await prisma.userClinicAppointmentWhitelist.findFirst({
    where: {
      User: {
        userId
      },
      Clinic: {
        clinicUid
      }
    },
    select: {
      WhitelistFilters: {
        select: {
          value: true,
          Filter: {
            select: {
              key: true,
            }
          }
        }
      }
    }
  });
  return { message: "Appointment whitelist successfully fetched.", data: appointmentWhitelist }
})

type Patient = {
  userId: string;
  UserEmployments: {
    departmentId: number | null;
    collegeId: number | null;
    officeId: number | null;
  }[];
  StudentRecords: {
    organizationId: number;
    programId: number | null;
    departmentId: number | null;
    collegeId: number | null;
  }[];
}
const isFilterMatch = <T extends Patient>(filterKey: string, filterValue: string, patient: T) => {
  if (filterKey === filterValue) return true;
  switch (filterKey) {
  case "department":
    return (
      patient?.StudentRecords.some((s) => s.departmentId?.toString() === filterValue) ||
        patient?.UserEmployments.some((e) => e.departmentId?.toString() === filterValue)
    );
  case "college":
    return (
      patient?.StudentRecords.some((s) => s.collegeId?.toString() === filterValue) ||
        patient?.UserEmployments.some((e) => e.collegeId?.toString() === filterValue)
    );
  case "office":
    return (
      patient?.UserEmployments.some((e) => e.officeId?.toString() === filterValue)
    );
  case "program":
    return (
      patient?.StudentRecords.some((s) => s.programId?.toString() === filterValue)
    );
  default:
    return false;
  }
};

const sendAppointmentRequestSent = async ({ users }: {
  users: {
    fullName: string,
    email: string,
    organization: string,
    orgMail: string
  }[]
}) => {
  try {
    const filePath = path.join(process.cwd(), "email-templates/clinic-appointment-sent.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    for (const user of users) {
      const { fullName: name, email, organization, orgMail } = user;
      const html = emailTemplate.replaceAll("@{userName}", name).replaceAll("@{orgName}", organization).replaceAll("@{appName}", appName).replaceAll("@{orgMail}", orgMail)
      await sendMail({
        subject: `Appointment Request Sent`,
        to: email,
        text: html,
        html
      })
    }
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
}


