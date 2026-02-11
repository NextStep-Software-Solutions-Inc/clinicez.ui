"use server";

import prisma from "@lib/prisma";
import { $Enums, Prisma } from "@prisma/client";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";
import { requireClinicPermission } from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";

type PrismaTransactionalClient = Parameters<
  Parameters<typeof prisma["$transaction"]>[0]
>[0];

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateAuditLogPayload = {
  entityType: $Enums.AuditEntityType;
  entityId: number;
  action: $Enums.AuditAction;
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
  performedBy?: number;
};

export type CreateFieldChangeLogsPayload = {
  entityType: $Enums.AuditEntityType;
  entityId: number;
  action: $Enums.AuditAction;
  changes: {
    fieldName: string;
    previousValue?: string;
    newValue?: string;
  }[];
  reason?: string;
  metadata?: Prisma.InputJsonValue;
  performedBy?: number;
};

export type GetAuditLogsPayload = {
  entityType?: $Enums.AuditEntityType;
  entityId?: number;
  action?: $Enums.AuditAction;
  fieldName?: string;
  performedBy?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  clinicUid?: string; // Required for permission check
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a single audit log entry. Can be used inside a Prisma transaction.
 */
export async function createAuditLog(
  payload: CreateAuditLogPayload,
  tx?: PrismaTransactionalClient
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      fieldName: payload.fieldName,
      previousValue: payload.previousValue,
      newValue: payload.newValue,
      reason: payload.reason,
      metadata: payload.metadata,
      performedBy: payload.performedBy,
    },
  });
}

/**
 * Create multiple audit log entries for field-level changes (batch).
 * Useful when an update touches many fields at once.
 */
export async function createFieldChangeLogs(
  payload: CreateFieldChangeLogsPayload,
  tx?: PrismaTransactionalClient
): Promise<void> {
  const client = tx ?? prisma;
  if (payload.changes.length === 0) return;

  await client.auditLog.createMany({
    data: payload.changes.map((change) => ({
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      fieldName: change.fieldName,
      previousValue: change.previousValue,
      newValue: change.newValue,
      reason: payload.reason,
      metadata: payload.metadata,
      performedBy: payload.performedBy,
    })),
  });
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Retrieve audit logs with flexible filtering, pagination, and ordering.
 * Requires VIEW:CLINIC:AUDIT_LOG permission if clinicUid is provided.
 */
export const getAuditLogsAction = withErrorHandling(
  async (payload: GetAuditLogsPayload) => {
    const session = await sessionCheck();

    // If clinicUid is provided, check for audit log viewing permission
    if (payload.clinicUid) {
      await requireClinicPermission(
        session.user.sub,
        payload.clinicUid,
        PERMISSIONS.CLINIC["VIEW:CLINIC:AUDIT_LOG"].name,
        "view audit logs"
      );
    }

    const page = payload.page ?? 1;
    const pageSize = Math.min(payload.pageSize ?? 25, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};

    if (payload.entityType) where.entityType = payload.entityType;
    if (payload.entityId) where.entityId = payload.entityId;
    if (payload.action) where.action = payload.action;
    if (payload.fieldName) where.fieldName = { contains: payload.fieldName, mode: "insensitive" };
    if (payload.performedBy) where.performedBy = payload.performedBy;

    if (payload.startDate || payload.endDate) {
      where.performedAt = {};
      if (payload.startDate) where.performedAt.gte = new Date(payload.startDate);
      if (payload.endDate) where.performedAt.lte = new Date(payload.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { performedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          Performer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      message: "Audit logs retrieved",
      data: {
        logs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }
);

export type GetAuditLogs = Awaited<ReturnType<typeof getAuditLogsAction>>;
