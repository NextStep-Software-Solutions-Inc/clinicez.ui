"use server";

import "server-only";
import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { Prisma, $Enums } from "@prisma/client";

export type OrgActivitiesParams = {
  orgUid: string;
  cursor?: number;
  pageSize?: number;
  action?: $Enums.AuditAction;
  entityType?: $Enums.AuditEntityType;
  from?: string;
  to?: string;
};

export type GetOrgActivities = Awaited<ReturnType<typeof getOrgActivitiesAction>>;

export const getOrgActivitiesAction = withErrorHandling(
  async ({
    orgUid,
    cursor,
    pageSize = 25,
    action,
    entityType,
    from,
    to,
  }: OrgActivitiesParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const limit = Math.min(pageSize, 100);

    const org = await prisma.organization.findFirst({
      where: { orgUid, isActive: true },
      select: { id: true, name: true, orgUid: true },
    });
    if (!org) throw new Error(`Organization with UID ${orgUid} not found`);

    // Build the base OR conditions for scoping to this organization
    const orgScopeConditions: Prisma.AuditLogWhereInput[] = [
      { entityType: "ORGANIZATION", entityId: org.id },
      {
        entityType: "ORG_MEMBER",
        entityId: {
          in: await prisma.organizationMember
            .findMany({
              where: { organizationId: org.id },
              select: { id: true },
            })
            .then((rows) => rows.map((r) => r.id)),
        },
      },
    ];

    const where: Prisma.AuditLogWhereInput = {
      OR: orgScopeConditions,
    };

    if (action) where.action = action;
    if (entityType === "ORGANIZATION") {
      // Scope to just organization-level events
      where.OR = [{ entityType: "ORGANIZATION", entityId: org.id }];
    } else if (entityType === "ORG_MEMBER") {
      // Scope to just org-member events
      where.OR = [orgScopeConditions[1]];
    }
    if (from || to) {
      where.performedAt = {};
      if (from) where.performedAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.performedAt.lte = toDate;
      }
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    const countWhere: Prisma.AuditLogWhereInput = { ...where };
    delete countWhere.id;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { performedAt: "desc" },
        take: limit + 1,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          action: true,
          fieldName: true,
          previousValue: true,
          newValue: true,
          reason: true,
          metadata: true,
          performedAt: true,
          Performer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              picture: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where: countWhere }),
    ]);

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      message: "Organization activities retrieved successfully",
      data: {
        org,
        items,
        total,
        hasMore,
        nextCursor: nextCursor ?? null,
      },
    };
  }
);
