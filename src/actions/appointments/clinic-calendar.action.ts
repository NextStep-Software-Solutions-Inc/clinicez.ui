"use server";

import "server-only";
import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction, type GetPermissions } from "@actions/permission.action";
import { getHPsAction, type GetHPsType } from "@actions/hp.actions";
import { PERMISSIONS } from "@lib/permissions";
import dayjs from "@lib/day-utils";

export type ClinicCalendarEvent = {
  id: number;
  subject: string;
  complaint: string | null;
  date: string;       // YYYY-MM-DD formatted
  timeStart: string;  // e.g. "09:00"
  timeEnd: string;    // e.g. "09:30"
  status: string;
  mode: string;
  type: string | null;
  meetingUrl: string | null;
  eventId: string | null;
  patient: { name: string; picture: string | null } | null;
  providers: { id: number; name: string; picture: string | null }[];
};

// Local type representing a single row returned by the Prisma select below
type AppointmentRow = {
  id: number;
  subject: string;
  complaint: string | null;
  AppointmentAttribute: {
    date: Date | null;
    timeStart: string | null;
    timeEnd: string | null;
    status: string;
    eventId: string | null;
    meetingUrl: string | null;
    AppointmentMode: { name: string };
    AppointmentType: { name: string } | null;
  } | null;
  Requesters: Array<{
    User: {
      firstName: string | null;
      lastName: string | null;
      picture: string | null;
    };
  }>;
  AppointmentRouting: Array<{
    RoutedTo: {
      id: number;
      HPProfile: { name: string; picture: string | null } | null;
      User: {
        firstName: string | null;
        lastName: string | null;
        picture: string | null;
      };
    };
  }>;
};

export const getClinicCalendarEventsAction = withErrorHandling(
  async (clinicUid: string, year: number, month: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const [permissions, myHps] = await Promise.all([
      getPermissionsAction({ userId: session.user.sub }),
      getHPsAction({ userId: session.user.sub }),
    ]);

    const userPermissionArray = permissions.map((p: GetPermissions[number]) => p.name);
    const myHpIds = myHps.map((hp: GetHPsType[number]) => hp.id);

    const canReadAll = userPermissionArray.includes(
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name,
    );
    const canReadOwn = userPermissionArray.includes(
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name,
    );
    const canReadAssigned = userPermissionArray.includes(
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name,
    );

    const monthStart = dayjs()
      .year(year)
      .month(month - 1)
      .startOf("month")
      .toDate();
    const monthEnd = dayjs()
      .year(year)
      .month(month - 1)
      .endOf("month")
      .toDate();

    // Guard: if user has no read permissions at all, return empty
    if (!canReadAll && !canReadOwn && !canReadAssigned) {
      return { message: "Clinic calendar events fetched", data: [] as ClinicCalendarEvent[] };
    }

    const rows = await prisma.appointment.findMany({
      where: {
        Clinic: { clinicUid },
        isActive: true,
        AppointmentAttribute: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        AND: [
          {
            OR: [
              // READ:ALL: when the user has READ:ALL permission the empty object
              // acts as a wildcard — Prisma treats {} inside OR as "no constraint",
              // so every appointment in the clinic (already scoped above) is returned.
              ...(canReadAll ? [{}] : []),
              ...(canReadOwn
                ? [{ Requesters: { some: { User: { userId: session.user.sub } } } }]
                : []),
              ...(canReadAssigned && myHpIds.length > 0
                ? [
                    {
                      AppointmentRouting: {
                        some: {
                          OR: [
                            { routedTo: { in: myHpIds } },
                            { RoutedBy: { userId: session.user.sub } },
                          ],
                        },
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      orderBy: {
        AppointmentAttribute: {
          timeStart: "asc",
        },
      },
      select: {
        id: true,
        subject: true,
        complaint: true,
        AppointmentAttribute: {
          select: {
            date: true,
            timeStart: true,
            timeEnd: true,
            status: true,
            eventId: true,
            meetingUrl: true,
            AppointmentMode: {
              select: { name: true },
            },
            AppointmentType: {
              select: { name: true },
            },
          },
        },
        Requesters: {
          take: 1,
          select: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                picture: true,
              },
            },
          },
        },
        AppointmentRouting: {
          where: {
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          select: {
            RoutedTo: {
              select: {
                id: true,
                HPProfile: {
                  select: {
                    name: true,
                    picture: true,
                  },
                },
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                    picture: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const events: ClinicCalendarEvent[] = (rows as AppointmentRow[]).map((row: AppointmentRow) => {
      const attr = row.AppointmentAttribute;
      const firstRequester = row.Requesters[0]?.User ?? null;
      const patientName = firstRequester
        ? `${firstRequester.firstName ?? ""} ${firstRequester.lastName ?? ""}`.trim()
        : null;

      const providers = row.AppointmentRouting.map((routing: AppointmentRow["AppointmentRouting"][number]) => {
        const rt = routing.RoutedTo;
        const providerName =
          rt.HPProfile?.name ??
          `${rt.User.firstName ?? ""} ${rt.User.lastName ?? ""}`.trim();
        return {
          id: rt.id,
          name: providerName || `HP #${rt.id}`,
          picture: rt.HPProfile?.picture ?? rt.User.picture ?? null,
        };
      });

      return {
        id: row.id,
        subject: row.subject,
        complaint: row.complaint ?? null,
        date: attr?.date ? dayjs(attr.date).format("YYYY-MM-DD") : "",
        timeStart: attr?.timeStart ?? "",
        timeEnd: attr?.timeEnd ?? "",
        status: attr?.status ?? "PENDING",
        mode: attr?.AppointmentMode?.name ?? "",
        type: attr?.AppointmentType?.name ?? null,
        meetingUrl: attr?.meetingUrl ?? null,
        eventId: attr?.eventId ?? null,
        patient: firstRequester
          ? {
              name: patientName ?? "Unknown",
              picture: firstRequester.picture ?? null,
            }
          : null,
        providers,
      };
    });

    return { message: "Clinic calendar events fetched", data: events };
  },
);
