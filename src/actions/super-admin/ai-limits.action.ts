'use server';

/**
 * Super Admin Actions for AI Usage Limit Management
 * 
 * Hierarchical AI allowance system:
 * - Super Admin sets global default limits
 * - Tenant inherits or overrides with custom limits
 * - Clinics under tenant must stay within tenant limits
 */

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { withErrorHandling } from '@/lib/with-error-handling';
import { isSuperAdminAction } from './admin-check.action';

export interface AILimitConfig {
  maxRequests: number;
  maxTokens?: number | null;
  maxCostUSD?: number | null;
  resetDay: number;
  isActive: boolean;
}

export interface GlobalAIDefaults {
  id: number;
  defaultMaxRequests: number;
  defaultMaxTokens: number | null;
  defaultMaxCostUSD: number | null;
  defaultResetDay: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get or create global AI default settings
 */
export const getGlobalAIDefaultsAction = withErrorHandling(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Check if user is super admin
  const isSuperAdmin = await isSuperAdminAction();

  if (!isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  // Get or create global defaults (singleton pattern)
  let defaults = await prisma.globalAIDefaults.findFirst();

  if (!defaults) {
    defaults = await prisma.globalAIDefaults.create({
      data: {
        defaultMaxRequests: 1000,
        defaultMaxTokens: 500000,
        defaultMaxCostUSD: 100.00,
        defaultResetDay: 1,
      },
    });
  }

  return { message: 'Global AI defaults retrieved successfully', data: defaults };
});

/**
 * Update global AI default settings
 */
export const updateGlobalAIDefaultsAction = withErrorHandling(async (config: {
  defaultMaxRequests: number;
  defaultMaxTokens?: number | null;
  defaultMaxCostUSD?: number | null;
  defaultResetDay: number;
}) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Check if user is super admin
  const isSuperAdmin = await isSuperAdminAction();

  if (!isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  // Validation
  if (config.defaultMaxRequests < 1) {
    throw new Error('Maximum requests must be at least 1');
  }

  if (config.defaultMaxTokens !== null && config.defaultMaxTokens !== undefined && config.defaultMaxTokens < 1) {
    throw new Error('Maximum tokens must be at least 1 or null');
  }

  if (config.defaultMaxCostUSD !== null && config.defaultMaxCostUSD !== undefined && config.defaultMaxCostUSD < 0.01) {
    throw new Error('Maximum cost must be at least $0.01 or null');
  }

  if (config.defaultResetDay < 1 || config.defaultResetDay > 31) {
    throw new Error('Reset day must be between 1 and 31');
  }

  // Update or create
  const defaults = await prisma.globalAIDefaults.upsert({
    where: { id: 1 }, // Singleton
    create: {
      id: 1,
      ...config,
    },
    update: config,
  });

  return { message: 'Global AI defaults updated successfully', data: defaults };
});

/**
 * Get tenant AI limit with fallback to global defaults
 */
export const getTenantAILimitAction = withErrorHandling(async (tenantId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Check if user is super admin
  const isSuperAdmin = await isSuperAdminAction();

  if (!isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  const limit = await prisma.aIUsageLimit.findUnique({
    where: { tenantId },
  });

  const globalDefaults = await prisma.globalAIDefaults.findFirst();

  return {
    message: 'Tenant AI limit retrieved successfully',
    data: {
      tenantLimit: limit,
      globalDefaults,
      effectiveLimit: limit || {
        maxRequests: globalDefaults?.defaultMaxRequests || 1000,
        maxTokens: globalDefaults?.defaultMaxTokens,
        maxCostUSD: globalDefaults?.defaultMaxCostUSD,
        resetDay: globalDefaults?.defaultResetDay || 1,
        isActive: true,
      },
    },
  };
});

/**
 * Set or update tenant AI limit
 */
export const setTenantAILimitAction = withErrorHandling(async (
  tenantId: number,
  config: AILimitConfig
) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Check if user is super admin
  const isSuperAdmin = await isSuperAdminAction();

  if (!isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  // Validation
  if (config.maxRequests < 1) {
    throw new Error('Maximum requests must be at least 1');
  }

  if (config.maxTokens !== null && config.maxTokens !== undefined && config.maxTokens < 1) {
    throw new Error('Maximum tokens must be at least 1 or null');
  }

  if (config.maxCostUSD !== null && config.maxCostUSD !== undefined && config.maxCostUSD < 0.01) {
    throw new Error('Maximum cost must be at least $0.01 or null');
  }

  if (config.resetDay < 1 || config.resetDay > 31) {
    throw new Error('Reset day must be between 1 and 31');
  }

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Get total clinic allocations
  const clinicLimits = await prisma.aIUsageLimit.findMany({
    where: {
      clinicId: { not: null },
      Clinic: { tenantId },
    },
  });

  const totalClinicRequests = clinicLimits.reduce((sum, limit) => sum + limit.maxRequests, 0);
  const totalClinicTokens = clinicLimits.reduce((sum, limit) => sum + (limit.maxTokens || 0), 0);
  const totalClinicCost = clinicLimits.reduce((sum, limit) => sum + (limit.maxCostUSD || 0), 0);

  // Validate that new tenant limit can accommodate existing clinic limits
  if (totalClinicRequests > config.maxRequests) {
    throw new Error(
      `Tenant limit (${config.maxRequests} requests) cannot be less than total clinic allocations (${totalClinicRequests} requests). Please reduce clinic limits first.`
    );
  }

  if (config.maxTokens && totalClinicTokens > config.maxTokens) {
    throw new Error(
      `Tenant token limit (${config.maxTokens}) cannot be less than total clinic allocations (${totalClinicTokens}). Please reduce clinic limits first.`
    );
  }

  if (config.maxCostUSD && totalClinicCost > config.maxCostUSD) {
    throw new Error(
      `Tenant cost limit ($${config.maxCostUSD}) cannot be less than total clinic allocations ($${totalClinicCost}). Please reduce clinic limits first.`
    );
  }

  // Upsert tenant limit
  const limit = await prisma.aIUsageLimit.upsert({
    where: { tenantId },
    create: {
      tenantId,
      limitType: 'MONTHLY',
      ...config,
    },
    update: config,
  });

  return { message: 'Tenant AI limit updated successfully', data: limit };
});

/**
 * Get clinic AI limit with validation against tenant limit
 */
export const getClinicAILimitAction = withErrorHandling(async (clinicId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Check if user is super admin or tenant admin
  const isSuperAdmin = await isSuperAdminAction();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: { 
      Tenant: {
        include: { Owner: true }
      }
    },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Check if user is tenant owner
  const isTenantOwner = clinic.Tenant.Owner?.userId === userId;

  if (!isSuperAdmin && !isTenantOwner) {
    throw new Error('Super admin or tenant owner access required');
  }

  const clinicLimit = await prisma.aIUsageLimit.findUnique({
    where: { clinicId },
  });

  const tenantLimit = await prisma.aIUsageLimit.findUnique({
    where: { tenantId: clinic.tenantId },
  });

  const globalDefaults = await prisma.globalAIDefaults.findFirst();

  // Calculate available capacity (tenant limit - sum of other clinic limits)
  const otherClinicLimits = await prisma.aIUsageLimit.findMany({
    where: {
      AND: [
        { clinicId: { not: null } },
        { clinicId: { not: clinicId } },
      ],
      Clinic: { tenantId: clinic.tenantId },
    },
  });

  const tenantMaxRequests = tenantLimit?.maxRequests || globalDefaults?.defaultMaxRequests || 1000;
  const tenantMaxTokens = tenantLimit?.maxTokens || globalDefaults?.defaultMaxTokens;
  const tenantMaxCost = tenantLimit?.maxCostUSD || globalDefaults?.defaultMaxCostUSD;

  const allocatedRequests = otherClinicLimits.reduce((sum, limit) => sum + limit.maxRequests, 0);
  const allocatedTokens = otherClinicLimits.reduce((sum, limit) => sum + (limit.maxTokens || 0), 0);
  const allocatedCost = otherClinicLimits.reduce((sum, limit) => sum + (limit.maxCostUSD || 0), 0);

  return {
    message: 'Clinic AI limit retrieved successfully',
    data: {
      clinicLimit,
      tenantLimit,
      globalDefaults,
      availableCapacity: {
        requests: tenantMaxRequests - allocatedRequests,
        tokens: tenantMaxTokens ? tenantMaxTokens - allocatedTokens : null,
        cost: tenantMaxCost ? tenantMaxCost - allocatedCost : null,
      },
      effectiveLimit: clinicLimit || {
        maxRequests: Math.min(100, tenantMaxRequests - allocatedRequests), // Default 100 or available
        maxTokens: tenantMaxTokens ? Math.min(50000, tenantMaxTokens - allocatedTokens) : null,
        maxCostUSD: tenantMaxCost ? Math.min(10, tenantMaxCost - allocatedCost) : null,
        resetDay: tenantLimit?.resetDay || globalDefaults?.defaultResetDay || 1,
        isActive: true,
      },
    },
  };
});

/**
 * Set or update clinic AI limit with tenant validation
 */
export const setClinicAILimitAction = withErrorHandling(async (
  clinicId: number,
  config: AILimitConfig
) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  // Validation
  if (config.maxRequests < 1) {
    throw new Error('Maximum requests must be at least 1');
  }

  if (config.maxTokens !== null && config.maxTokens !== undefined && config.maxTokens < 1) {
    throw new Error('Maximum tokens must be at least 1 or null');
  }

  if (config.maxCostUSD !== null && config.maxCostUSD !== undefined && config.maxCostUSD < 0.01) {
    throw new Error('Maximum cost must be at least $0.01 or null');
  }

  if (config.resetDay < 1 || config.resetDay > 31) {
    throw new Error('Reset day must be between 1 and 31');
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: { Tenant: { include: { Owner: true } } },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Check permissions
  const isSuperAdmin = await isSuperAdminAction();

  const isTenantOwner = clinic.Tenant.Owner?.userId === userId;

  if (!isSuperAdmin && !isTenantOwner) {
    throw new Error('Super admin or tenant owner access required');
  }

  // Get tenant limit
  const tenantLimit = await prisma.aIUsageLimit.findUnique({
    where: { tenantId: clinic.tenantId },
  });

  const globalDefaults = await prisma.globalAIDefaults.findFirst();

  const tenantMaxRequests = tenantLimit?.maxRequests || globalDefaults?.defaultMaxRequests || 1000;
  const tenantMaxTokens = tenantLimit?.maxTokens || globalDefaults?.defaultMaxTokens;
  const tenantMaxCost = tenantLimit?.maxCostUSD || globalDefaults?.defaultMaxCostUSD;

  // Get other clinic limits in same tenant
  const otherClinicLimits = await prisma.aIUsageLimit.findMany({
    where: {
      AND: [
        { clinicId: { not: null } },
        { clinicId: { not: clinicId } },
      ],
      Clinic: { tenantId: clinic.tenantId },
    },
  });

  const otherClinicRequests = otherClinicLimits.reduce((sum, limit) => sum + limit.maxRequests, 0);
  const otherClinicTokens = otherClinicLimits.reduce((sum, limit) => sum + (limit.maxTokens || 0), 0);
  const otherClinicCost = otherClinicLimits.reduce((sum, limit) => sum + (limit.maxCostUSD || 0), 0);

  // Validate against tenant limits
  if (otherClinicRequests + config.maxRequests > tenantMaxRequests) {
    throw new Error(
      `Sum of clinic limits (${otherClinicRequests + config.maxRequests} requests) exceeds tenant limit (${tenantMaxRequests} requests). Available: ${tenantMaxRequests - otherClinicRequests} requests.`
    );
  }

  if (config.maxTokens && tenantMaxTokens && otherClinicTokens + config.maxTokens > tenantMaxTokens) {
    throw new Error(
      `Sum of clinic token limits (${otherClinicTokens + config.maxTokens}) exceeds tenant limit (${tenantMaxTokens}). Available: ${tenantMaxTokens - otherClinicTokens} tokens.`
    );
  }

  if (config.maxCostUSD && tenantMaxCost && otherClinicCost + config.maxCostUSD > tenantMaxCost) {
    throw new Error(
      `Sum of clinic cost limits ($${(otherClinicCost + config.maxCostUSD).toFixed(2)}) exceeds tenant limit ($${tenantMaxCost.toFixed(2)}). Available: $${(tenantMaxCost - otherClinicCost).toFixed(2)}.`
    );
  }

  // Upsert clinic limit
  const limit = await prisma.aIUsageLimit.upsert({
    where: { clinicId },
    create: {
      clinicId,
      limitType: 'MONTHLY',
      ...config,
    },
    update: config,
  });

  return { message: 'Clinic AI limit updated successfully', data: limit };
});

/**
 * Get all tenant AI limits for super admin dashboard
 */
export const getAllTenantAILimitsAction = withErrorHandling(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  const isSuperAdmin = await isSuperAdminAction();

  if (!isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  const limits = await prisma.aIUsageLimit.findMany({
    where: { tenantId: { not: null } },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          tenantUid: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const globalDefaults = await prisma.globalAIDefaults.findFirst();

  return {
    message: 'Tenant AI limits retrieved successfully',
    data: {
      limits,
      globalDefaults,
    },
  };
});

/**
 * Get all clinic AI limits for a tenant
 */
export const getTenantClinicAILimitsAction = withErrorHandling(async (tenantId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  const isSuperAdmin = await isSuperAdminAction();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { Owner: true },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const isTenantOwner = tenant.Owner?.userId === userId;

  if (!isSuperAdmin && !isTenantOwner) {
    throw new Error('Super admin or tenant owner access required');
  }

  const clinicLimits = await prisma.aIUsageLimit.findMany({
    where: {
      clinicId: { not: null },
      Clinic: { tenantId },
    },
    include: {
      Clinic: {
        select: {
          id: true,
          name: true,
          clinicUid: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const tenantLimit = await prisma.aIUsageLimit.findUnique({
    where: { tenantId },
  });

  const globalDefaults = await prisma.globalAIDefaults.findFirst();

  const tenantMaxRequests = tenantLimit?.maxRequests || globalDefaults?.defaultMaxRequests || 1000;
  const tenantMaxTokens = tenantLimit?.maxTokens || globalDefaults?.defaultMaxTokens;
  const tenantMaxCost = tenantLimit?.maxCostUSD || globalDefaults?.defaultMaxCostUSD;

  const allocatedRequests = clinicLimits.reduce((sum, limit) => sum + limit.maxRequests, 0);
  const allocatedTokens = clinicLimits.reduce((sum, limit) => sum + (limit.maxTokens || 0), 0);
  const allocatedCost = clinicLimits.reduce((sum, limit) => sum + (limit.maxCostUSD || 0), 0);

  return {
    message: 'Clinic AI limits retrieved successfully',
    data: {
      clinicLimits,
      tenantLimit,
      globalDefaults,
      summary: {
        tenantCapacity: {
          requests: tenantMaxRequests,
          tokens: tenantMaxTokens,
          cost: tenantMaxCost,
        },
        allocated: {
          requests: allocatedRequests,
          tokens: allocatedTokens,
          cost: allocatedCost,
        },
        available: {
          requests: tenantMaxRequests - allocatedRequests,
          tokens: tenantMaxTokens ? tenantMaxTokens - allocatedTokens : null,
          cost: tenantMaxCost ? tenantMaxCost - allocatedCost : null,
        },
      },
    },
  };
});
