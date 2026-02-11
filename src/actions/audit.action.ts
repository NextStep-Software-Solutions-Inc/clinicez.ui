'use server';

import { db } from '@/lib/db';
import { AuditActionType, EntityType } from '@prisma/client';

export interface AuditLogInput {
  actorId?: number;
  actionType: AuditActionType;
  entityType: EntityType;
  entityId?: number;
  targetUserId?: number;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput) {
  try {
    const auditLog = await db.auditLog.create({
      data: {
        actorId: input.actorId,
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId,
        targetUserId: input.targetUserId,
        fieldName: input.fieldName,
        oldValue: input.oldValue,
        newValue: input.newValue,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return { success: true, data: auditLog };
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return { success: false, error: 'Failed to create audit log' };
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(params: {
  entityType?: EntityType;
  entityId?: number;
  targetUserId?: number;
  actorId?: number;
  actionType?: AuditActionType;
  page?: number;
  perPage?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const {
    entityType,
    entityId,
    targetUserId,
    actorId,
    actionType,
    page = 1,
    perPage = 50,
    startDate,
    endDate,
  } = params;

  try {
    const where: {
      entityType?: EntityType;
      entityId?: number;
      targetUserId?: number;
      actorId?: number;
      actionType?: AuditActionType;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (targetUserId) where.targetUserId = targetUserId;
    if (actorId) where.actorId = actorId;
    if (actionType) where.actionType = actionType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          Actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          TargetUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}

/**
 * Log field-level changes
 */
export async function logFieldChanges(params: {
  actorId: number;
  entityType: EntityType;
  entityId: number;
  targetUserId?: number;
  changes: Array<{
    fieldName: string;
    oldValue: string;
    newValue: string;
  }>;
  metadata?: Record<string, unknown>;
}) {
  const { actorId, entityType, entityId, targetUserId, changes, metadata } = params;

  try {
    const auditLogs = await db.auditLog.createMany({
      data: changes.map((change) => ({
        actorId,
        actionType: AuditActionType.UPDATE,
        entityType,
        entityId,
        targetUserId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      })),
    });

    return { success: true, data: auditLogs };
  } catch (error) {
    console.error('Failed to log field changes:', error);
    return { success: false, error: 'Failed to log field changes' };
  }
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogs(params: {
  entityType?: EntityType;
  entityId?: number;
  targetUserId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const result = await getAuditLogs({ ...params, perPage: 10000 });

  if (!result.success || !result.data) {
    return { success: false, error: 'Failed to fetch audit logs for export' };
  }

  const csv = [
    'Date,Actor,Action,Entity Type,Entity ID,Target User,Field,Old Value,New Value',
    ...result.data.map((log) =>
      [
        log.createdAt.toISOString(),
        log.Actor
          ? `${log.Actor.firstName} ${log.Actor.lastName} (${log.Actor.email})`
          : 'System',
        log.actionType,
        log.entityType,
        log.entityId || '',
        log.TargetUser
          ? `${log.TargetUser.firstName} ${log.TargetUser.lastName}`
          : '',
        log.fieldName || '',
        log.oldValue || '',
        log.newValue || '',
      ].join(',')
    ),
  ].join('\n');

  return { success: true, data: csv };
}
