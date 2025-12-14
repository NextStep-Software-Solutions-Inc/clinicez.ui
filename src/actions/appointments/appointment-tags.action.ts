"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";
import { cache } from "react";

type TagHealthcareProvidersPayload = {
  appointmentId: number;
  healthcareProviderIds: number[];
};

/**
 * Tag healthcare providers to an appointment (informational only, no workflow/notifications).
 * This replaces all existing tags with the new set of healthcare provider IDs.
 */
export const tagHealthcareProvidersAction = withErrorHandling(
  async (payload: TagHealthcareProvidersPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { appointmentId, healthcareProviderIds } = payload;

    // Validate input
    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // Check permissions
    const permissions = await getPermissionsAction({ userId: session.user.sub });
    const userPermissionArray = permissions.map((p) => p.name);
    const requiredPermissions = [
      PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT"].name,
    ];
    const canTagHPs = requiredPermissions.every((p) =>
      userPermissionArray.includes(p)
    );

    if (!canTagHPs) {
      throw new Error(
        "You do not have permission to tag healthcare providers on appointments"
      );
    }

    // Verify the appointment exists and is active
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, isActive: true },
      select: { id: true },
    });

    if (!appointment) {
      throw new Error("Appointment not found or inactive");
    }

    // Verify all healthcare providers exist and are active
    if (healthcareProviderIds.length > 0) {
      const hpCount = await prisma.healthcareProvider.count({
        where: {
          id: { in: healthcareProviderIds },
          isActive: true,
        },
      });

      if (hpCount !== healthcareProviderIds.length) {
        throw new Error("One or more healthcare providers not found or inactive");
      }
    }

    // Use a transaction to replace all tags atomically
    await prisma.$transaction(async (tx) => {
      // Delete existing tags
      await tx.appointmentTag.deleteMany({
        where: { appointmentId },
      });

      // Create new tags if any
      if (healthcareProviderIds.length > 0) {
        await tx.appointmentTag.createMany({
          data: healthcareProviderIds.map((hpId) => ({
            appointmentId,
            healthcareProviderId: hpId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return {
      message: "Healthcare providers tagged successfully",
      data: { appointmentId, healthcareProviderIds },
    };
  }
);

type GetAppointmentTagsParams = {
  appointmentId: number;
};

/**
 * Get all tagged healthcare providers for an appointment
 */
export type GetAppointmentTags = Awaited<
  ReturnType<typeof getAppointmentTagsAction>
>;
export const getAppointmentTagsAction = withErrorHandling(
  cache(async (params: GetAppointmentTagsParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { appointmentId } = params;

    // Check permissions
    const permissions = await getPermissionsAction({ userId: session.user.sub });
    const userPermissionArray = permissions.map((p) => p.name);
    const readPermissions = [
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ALL"].name,
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name,
      PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:ASSIGNED"].name,
    ];
    const canReadAppointments = readPermissions.some((p) =>
      userPermissionArray.includes(p)
    );

    if (!canReadAppointments) {
      throw new Error("You do not have permission to view appointments");
    }

    const tags = await prisma.appointmentTag.findMany({
      where: { appointmentId },
      select: {
        id: true,
        healthcareProviderId: true,
        HealthcareProvider: {
          select: {
            id: true,
            HPProfile: {
              select: {
                title: true,
                name: true,
                suffix: true,
                fields: true,
              },
            },
            User: {
              select: {
                userId: true,
                firstName: true,
                middleName: true,
                lastName: true,
                suffix: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      message: "Appointment tags fetched successfully",
      data: tags,
    };
  })
);

type RemoveAppointmentTagPayload = {
  appointmentId: number;
  healthcareProviderId: number;
};

/**
 * Remove a specific healthcare provider tag from an appointment
 */
export const removeAppointmentTagAction = withErrorHandling(
  async (payload: RemoveAppointmentTagPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { appointmentId, healthcareProviderId } = payload;

    // Check permissions
    const permissions = await getPermissionsAction({ userId: session.user.sub });
    const userPermissionArray = permissions.map((p) => p.name);
    const requiredPermissions = [
      PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT"].name,
    ];
    const canRemoveTag = requiredPermissions.every((p) =>
      userPermissionArray.includes(p)
    );

    if (!canRemoveTag) {
      throw new Error(
        "You do not have permission to remove tags from appointments"
      );
    }

    // Delete the tag
    await prisma.appointmentTag.deleteMany({
      where: {
        appointmentId,
        healthcareProviderId,
      },
    });

    return {
      message: "Tag removed successfully",
      data: { appointmentId, healthcareProviderId },
    };
  }
);
