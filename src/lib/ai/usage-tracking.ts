/**
 * AI Usage Tracking and Rate Limiting Service
 * 
 * Tracks AI usage, enforces limits, and prevents overcharging.
 */

import prisma from '@/lib/prisma';
import { estimateCost } from '@/lib/ai/utils';
import { AIProvider, AIFeatureType } from '@/lib/ai/types';

export interface AIUsageContext {
  userId: string;
  clinicId?: number;
  tenantId?: number;
  featureType: AIFeatureType;
}

export interface AIUsageData {
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Check if user/clinic/tenant has exceeded their AI usage limit
 */
export async function checkAIUsageLimit(context: AIUsageContext): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    requests: number;
    tokens: number;
    costUSD: number;
  };
  limit?: {
    maxRequests: number;
    maxTokens?: number;
    maxCostUSD?: number;
  };
}> {
  try {
    // Get the current period (YYYY-MM format)
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check clinic limit first (if applicable)
    if (context.clinicId) {
      const clinicLimit = await prisma.aIUsageLimit.findUnique({
        where: { clinicId: context.clinicId },
      });

      if (clinicLimit && clinicLimit.isActive) {
        const clinicUsage = await prisma.aIUsageSummary.findUnique({
          where: {
            clinicId_period: {
              clinicId: context.clinicId,
              period,
            },
          },
        });

        const currentRequests = clinicUsage?.totalRequests || 0;
        const currentTokens = clinicUsage?.totalTokens || 0;
        const currentCost = clinicUsage?.totalCostUSD || 0;

        // Check request limit
        if (currentRequests >= clinicLimit.maxRequests) {
          return {
            allowed: false,
            reason: `Clinic has reached the monthly limit of ${clinicLimit.maxRequests} AI requests. Limit resets on day ${clinicLimit.resetDay} of next month.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: clinicLimit.maxRequests,
              maxTokens: clinicLimit.maxTokens || undefined,
              maxCostUSD: clinicLimit.maxCostUSD || undefined,
            },
          };
        }

        // Check token limit (if set)
        if (clinicLimit.maxTokens && currentTokens >= clinicLimit.maxTokens) {
          return {
            allowed: false,
            reason: `Clinic has reached the monthly token limit of ${clinicLimit.maxTokens.toLocaleString()} tokens.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: clinicLimit.maxRequests,
              maxTokens: clinicLimit.maxTokens,
              maxCostUSD: clinicLimit.maxCostUSD || undefined,
            },
          };
        }

        // Check cost limit (if set)
        if (clinicLimit.maxCostUSD && currentCost >= clinicLimit.maxCostUSD) {
          return {
            allowed: false,
            reason: `Clinic has reached the monthly cost limit of $${clinicLimit.maxCostUSD.toFixed(2)}.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: clinicLimit.maxRequests,
              maxTokens: clinicLimit.maxTokens || undefined,
              maxCostUSD: clinicLimit.maxCostUSD,
            },
          };
        }

        return {
          allowed: true,
          currentUsage: {
            requests: currentRequests,
            tokens: currentTokens,
            costUSD: currentCost,
          },
          limit: {
            maxRequests: clinicLimit.maxRequests,
            maxTokens: clinicLimit.maxTokens || undefined,
            maxCostUSD: clinicLimit.maxCostUSD || undefined,
          },
        };
      }
    }

    // Check tenant limit (if applicable and no clinic limit)
    if (context.tenantId) {
      const tenantLimit = await prisma.aIUsageLimit.findUnique({
        where: { tenantId: context.tenantId },
      });

      if (tenantLimit && tenantLimit.isActive) {
        const tenantUsage = await prisma.aIUsageSummary.findUnique({
          where: {
            tenantId_period: {
              tenantId: context.tenantId,
              period,
            },
          },
        });

        const currentRequests = tenantUsage?.totalRequests || 0;
        const currentTokens = tenantUsage?.totalTokens || 0;
        const currentCost = tenantUsage?.totalCostUSD || 0;

        // Check request limit
        if (currentRequests >= tenantLimit.maxRequests) {
          return {
            allowed: false,
            reason: `Organization has reached the monthly limit of ${tenantLimit.maxRequests} AI requests. Limit resets on day ${tenantLimit.resetDay} of next month.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: tenantLimit.maxRequests,
              maxTokens: tenantLimit.maxTokens || undefined,
              maxCostUSD: tenantLimit.maxCostUSD || undefined,
            },
          };
        }

        // Check token limit (if set)
        if (tenantLimit.maxTokens && currentTokens >= tenantLimit.maxTokens) {
          return {
            allowed: false,
            reason: `Organization has reached the monthly token limit of ${tenantLimit.maxTokens.toLocaleString()} tokens.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: tenantLimit.maxRequests,
              maxTokens: tenantLimit.maxTokens,
              maxCostUSD: tenantLimit.maxCostUSD || undefined,
            },
          };
        }

        // Check cost limit (if set)
        if (tenantLimit.maxCostUSD && currentCost >= tenantLimit.maxCostUSD) {
          return {
            allowed: false,
            reason: `Organization has reached the monthly cost limit of $${tenantLimit.maxCostUSD.toFixed(2)}.`,
            currentUsage: {
              requests: currentRequests,
              tokens: currentTokens,
              costUSD: currentCost,
            },
            limit: {
              maxRequests: tenantLimit.maxRequests,
              maxTokens: tenantLimit.maxTokens || undefined,
              maxCostUSD: tenantLimit.maxCostUSD,
            },
          };
        }

        return {
          allowed: true,
          currentUsage: {
            requests: currentRequests,
            tokens: currentTokens,
            costUSD: currentCost,
          },
          limit: {
            maxRequests: tenantLimit.maxRequests,
            maxTokens: tenantLimit.maxTokens || undefined,
            maxCostUSD: tenantLimit.maxCostUSD || undefined,
          },
        };
      }
    }

    // No limits configured - allow
    return { allowed: true };
  } catch (error) {
    console.error('Error checking AI usage limit:', error);
    // On error, allow the request but log it
    return { allowed: true };
  }
}

/**
 * Log AI usage to database
 */
export async function logAIUsage(context: AIUsageContext, usage: AIUsageData): Promise<void> {
  try {
    const cost = estimateCost(usage.provider, usage.model, usage.promptTokens, usage.completionTokens);
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Log individual usage
    await prisma.aIUsageLog.create({
      data: {
        userId: context.userId,
        clinicId: context.clinicId,
        tenantId: context.tenantId,
        featureType: context.featureType,
        provider: usage.provider,
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCost: cost,
        success: usage.success,
        errorMessage: usage.errorMessage,
      },
    });

    // Update clinic summary if applicable
    if (context.clinicId) {
      await prisma.aIUsageSummary.upsert({
        where: {
          clinicId_period: {
            clinicId: context.clinicId,
            period,
          },
        },
        create: {
          clinicId: context.clinicId,
          period,
          totalRequests: 1,
          totalTokens: usage.totalTokens,
          totalCostUSD: cost,
          successfulRequests: usage.success ? 1 : 0,
          failedRequests: usage.success ? 0 : 1,
          lastUpdated: new Date(),
        },
        update: {
          totalRequests: { increment: 1 },
          totalTokens: { increment: usage.totalTokens },
          totalCostUSD: { increment: cost },
          successfulRequests: usage.success ? { increment: 1 } : undefined,
          failedRequests: usage.success ? undefined : { increment: 1 },
          lastUpdated: new Date(),
        },
      });
    }

    // Update tenant summary if applicable
    if (context.tenantId) {
      await prisma.aIUsageSummary.upsert({
        where: {
          tenantId_period: {
            tenantId: context.tenantId,
            period,
          },
        },
        create: {
          tenantId: context.tenantId,
          period,
          totalRequests: 1,
          totalTokens: usage.totalTokens,
          totalCostUSD: cost,
          successfulRequests: usage.success ? 1 : 0,
          failedRequests: usage.success ? 0 : 1,
          lastUpdated: new Date(),
        },
        update: {
          totalRequests: { increment: 1 },
          totalTokens: { increment: usage.totalTokens },
          totalCostUSD: { increment: cost },
          successfulRequests: usage.success ? { increment: 1 } : undefined,
          failedRequests: usage.success ? undefined : { increment: 1 },
          lastUpdated: new Date(),
        },
      });
    }
  } catch (error) {
    // Log error but don't throw - we don't want to fail the AI operation because logging failed
    console.error('Error logging AI usage:', error);
  }
}

/**
 * Get current usage for a clinic or tenant
 */
export async function getAIUsage(clinicId?: number, tenantId?: number): Promise<{
  currentPeriod: {
    requests: number;
    tokens: number;
    costUSD: number;
    successRate: number;
  };
  limit?: {
    maxRequests: number;
    maxTokens?: number;
    maxCostUSD?: number;
  };
  percentUsed: {
    requests: number;
    tokens?: number;
    cost?: number;
  };
}> {
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  let usage, limit;

  if (clinicId) {
    usage = await prisma.aIUsageSummary.findUnique({
      where: { clinicId_period: { clinicId, period } },
    });
    limit = await prisma.aIUsageLimit.findUnique({
      where: { clinicId },
    });
  } else if (tenantId) {
    usage = await prisma.aIUsageSummary.findUnique({
      where: { tenantId_period: { tenantId, period } },
    });
    limit = await prisma.aIUsageLimit.findUnique({
      where: { tenantId },
    });
  }

  const totalRequests = usage?.totalRequests || 0;
  const totalTokens = usage?.totalTokens || 0;
  const totalCostUSD = usage?.totalCostUSD || 0;
  const successfulRequests = usage?.successfulRequests || 0;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

  const percentUsed = {
    requests: limit?.maxRequests ? (totalRequests / limit.maxRequests) * 100 : 0,
    tokens: limit?.maxTokens ? (totalTokens / limit.maxTokens) * 100 : undefined,
    cost: limit?.maxCostUSD ? (totalCostUSD / limit.maxCostUSD) * 100 : undefined,
  };

  return {
    currentPeriod: {
      requests: totalRequests,
      tokens: totalTokens,
      costUSD: totalCostUSD,
      successRate,
    },
    limit: limit
      ? {
          maxRequests: limit.maxRequests,
          maxTokens: limit.maxTokens || undefined,
          maxCostUSD: limit.maxCostUSD || undefined,
        }
      : undefined,
    percentUsed,
  };
}
