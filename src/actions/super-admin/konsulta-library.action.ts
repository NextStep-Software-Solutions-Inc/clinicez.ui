"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { $Enums } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { createAuditLog } from "@/actions/audit.action";
import { refreshPhilHealthKonsultaReferenceLibrary } from "@/lib/konsulta-library-persistence";
import { isSuperAdminAction } from "./admin-check.action";

type ActionResult<T> = {
  status: boolean;
  message: string;
  data: T | null;
};

export async function refreshKonsultaPhilHealthReferencesAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof refreshPhilHealthKonsultaReferenceLibrary>>>
> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      throw new Error("Super admin privileges required.");
    }

    const result = await refreshPhilHealthKonsultaReferenceLibrary();
    const session = await getCachedSession();
    const appUser = session
      ? await prisma.user.findFirst({
          where: {
            userId: session.user.sub,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        })
      : null;

    await createAuditLog({
      entityType: $Enums.AuditEntityType.CLINIC,
      entityId: 0,
      action: $Enums.AuditAction.UPDATE,
      fieldName: "philhealth_konsulta_reference_refresh",
      reason: "Refreshed PhilHealth Konsulta reference library",
      metadata: result,
      performedBy: appUser?.id ?? undefined,
    });
    revalidatePath("/super-admin/konsulta-libraries");

    return {
      status: true,
      message: "PhilHealth Konsulta references refreshed.",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to refresh PhilHealth Konsulta references.",
      data: null,
    };
  }
}

export async function getKonsultaReferenceRefreshAuditHistoryAction(): Promise<
  ActionResult<
    Array<{
      id: number;
      performedAt: Date;
      reason: string | null;
      metadata: unknown;
      performerName: string;
    }>
  >
> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      throw new Error("Super admin privileges required.");
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: $Enums.AuditEntityType.CLINIC,
        entityId: 0,
        fieldName: "philhealth_konsulta_reference_refresh",
      },
      orderBy: {
        performedAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        performedAt: true,
        reason: true,
        metadata: true,
        Performer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      status: true,
      message: "PhilHealth reference refresh history fetched.",
      data: logs.map((log) => ({
        id: log.id,
        performedAt: log.performedAt,
        reason: log.reason,
        metadata: log.metadata,
        performerName:
          [log.Performer?.firstName, log.Performer?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          log.Performer?.email ||
          "System",
      })),
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch PhilHealth reference refresh history.",
      data: null,
    };
  }
}
