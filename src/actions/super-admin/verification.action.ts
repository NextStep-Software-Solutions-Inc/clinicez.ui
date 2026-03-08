"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";
import { getCachedSession } from "@actions/session.action";
import { createNotification } from "@/actions/notifications/notification.action";
import type { VerificationStatus, ValidIDLevel } from "@prisma/client";

// ──────────────────────────────────────────────────────────────
// Error messages
// ──────────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized: Only super admins can manage verifications",
  REQUEST_NOT_FOUND: "Verification request not found",
  ALREADY_REVIEWED: "This verification request has already been reviewed",
} as const;

async function requireSuperAdmin(): Promise<void> {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
}

async function getCurrentUserId(): Promise<number> {
  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const user = await prisma.user.findUnique({
    where: { userId: session.user.sub },
    select: { id: true },
  });
  if (!user) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  return user.id;
}

// ──────────────────────────────────────────────────────────────
// 1. List Verification Requests
// ──────────────────────────────────────────────────────────────

export type GetAllVerificationRequests = Awaited<ReturnType<typeof getAllVerificationRequestsAction>>;
export async function getAllVerificationRequestsAction({
  status,
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  status?: VerificationStatus;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  await requireSuperAdmin();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          User: {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where,
      select: {
        id: true,
        status: true,
        reviewerNotes: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        User: {
          select: {
            id: true,
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
        Reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        VerificationDocuments: {
          select: {
            id: true,
            idPhotoUrl: true,
            selfieWithIdUrl: true,
            selfieWithoutIdUrl: true,
            ValidIDType: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.verificationRequest.count({ where }),
  ]);

  return {
    data: requests,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ──────────────────────────────────────────────────────────────
// 2. Approve Verification Request
// ──────────────────────────────────────────────────────────────

export async function approveVerificationRequestAction({
  requestId,
  reviewerNotes,
}: {
  requestId: number;
  reviewerNotes?: string;
}) {
  await requireSuperAdmin();

  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, userId: true },
  });

  if (!request) throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
  if (request.status !== "PENDING") throw new Error(ERROR_MESSAGES.ALREADY_REVIEWED);

  const reviewerId = await getCurrentUserId();

  const [updatedRequest] = await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: "VERIFIED",
        reviewerNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    }),
  ]);

  // Notify the user that their verification has been approved
  await createNotification({
    userId: request.userId,
    type: "VERIFICATION_APPROVED",
    title: "Identity Verified",
    message: "Your identity verification has been approved. Your account is now verified.",
    link: "/v2/profile",
  });

  return { data: updatedRequest };
}

// ──────────────────────────────────────────────────────────────
// 3. Reject Verification Request
// ──────────────────────────────────────────────────────────────

export async function rejectVerificationRequestAction({
  requestId,
  reviewerNotes,
}: {
  requestId: number;
  reviewerNotes: string;
}) {
  await requireSuperAdmin();

  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, userId: true },
  });

  if (!request) throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
  if (request.status !== "PENDING") throw new Error(ERROR_MESSAGES.ALREADY_REVIEWED);

  const reviewerId = await getCurrentUserId();

  const [updatedRequest] = await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewerNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: {
        verificationStatus: "REJECTED",
      },
    }),
  ]);

  // Notify the user that their verification has been rejected
  await createNotification({
    userId: request.userId,
    type: "VERIFICATION_REJECTED",
    title: "Verification Rejected",
    message: `Your identity verification was not approved. Reason: ${reviewerNotes}`,
    link: "/v2/profile",
  });

  return { data: updatedRequest };
}

// ──────────────────────────────────────────────────────────────
// 4. Valid ID Types Management
// ──────────────────────────────────────────────────────────────

export type GetAllValidIDTypes = Awaited<ReturnType<typeof getAllValidIDTypesAction>>;
export async function getAllValidIDTypesAction() {
  await requireSuperAdmin();

  const idTypes = await prisma.validIDType.findMany({
    where: { isActive: true },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      description: true,
      automatedVerification: true,
      isActive: true,
    },
  });

  return { data: idTypes };
}

export async function createValidIDTypeAction({
  name,
  level,
  description,
  automatedVerification = false,
}: {
  name: string;
  level: ValidIDLevel;
  description?: string;
  automatedVerification?: boolean;
}) {
  await requireSuperAdmin();

  const idType = await prisma.validIDType.create({
    data: {
      name,
      level,
      description,
      automatedVerification,
    },
  });

  return { data: idType };
}

export async function updateValidIDTypeAction({
  id,
  name,
  level,
  description,
  automatedVerification,
  isActive,
}: {
  id: number;
  name?: string;
  level?: ValidIDLevel;
  description?: string;
  automatedVerification?: boolean;
  isActive?: boolean;
}) {
  await requireSuperAdmin();

  const idType = await prisma.validIDType.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(level !== undefined && { level }),
      ...(description !== undefined && { description }),
      ...(automatedVerification !== undefined && { automatedVerification }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return { data: idType };
}
