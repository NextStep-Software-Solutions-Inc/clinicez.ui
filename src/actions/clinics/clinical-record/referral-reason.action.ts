"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

interface FrequencyBasedReason {
  id: number;
  name: string;
  isActive: boolean;
  count: number;
}

// Frequency threshold for a reason to be considered "common"
const FREQUENCY_THRESHOLD = 3;

export type GetReferralReasons = Awaited<ReturnType<typeof getReferralReasonsAction>>;
export const getReferralReasonsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const rawReasons = await prisma.clinicReferralSlip.findMany({
    where: {
      AND: [
        {
          reason: {
            not: null
          }
        },
        {
          reason: {
            not: ""
          }
        }
      ]
    },
    select: {
      id: true,
      reason: true,
      isActive: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  // Filter only active records
  const activeReasons = rawReasons.filter(r => r.isActive);

  const reasonCounts = new Map<string, { originalCase: string; count: number }>();

  activeReasons.forEach(item => {
    if (item.reason) {
      const lowerCase = item.reason.toLowerCase().trim();
      if (lowerCase) {
        const existing = reasonCounts.get(lowerCase);
        if (existing) {
          existing.count += 1;
        } else {
          reasonCounts.set(lowerCase, {
            originalCase: item.reason.trim(),
            count: 1
          });
        }
      }
    }
  });

  // Filter by frequency threshold and transform
  const filteredReasons = Array.from(reasonCounts.entries())
    .filter(([_, data]) => data.count >= FREQUENCY_THRESHOLD)
    .sort((a, b) => b[1].count - a[1].count);

  const reasons: FrequencyBasedReason[] = filteredReasons.map(([_, data], index) => ({
    id: index + 1,  // Fake ID
    name: data.originalCase,
    isActive: true,
    count: data.count
  }));

  return { message: "Referral reasons fetched successfully", data: reasons };
});
