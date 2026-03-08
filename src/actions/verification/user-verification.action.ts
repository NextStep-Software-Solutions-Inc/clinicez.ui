"use server";

import "server-only";
import prisma from "@lib/prisma";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";
import {
  createNotification,
  createNotifications,
} from "@/actions/notifications/notification.action";

// ──────────────────────────────────────────────────────────────
// 1. Get current user's verification status
// ──────────────────────────────────────────────────────────────

export type GetUserVerificationStatus = Awaited<ReturnType<typeof getUserVerificationStatusAction>>;

export const getUserVerificationStatusAction = withErrorHandling(async () => {
  const session = await sessionCheck();

  const user = await prisma.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: {
      id: true,
      verificationStatus: true,
      verifiedAt: true,
      lastProfileUpdateAt: true,
      VerificationRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          reviewerNotes: true,
          reviewedAt: true,
          createdAt: true,
          VerificationDocuments: {
            select: {
              id: true,
              ValidIDType: {
                select: { id: true, name: true, level: true },
              },
            },
          },
        },
      },
    },
  });

  return {
    message: "Verification status fetched",
    data: {
      verificationStatus: user.verificationStatus,
      verifiedAt: user.verifiedAt,
      lastProfileUpdateAt: user.lastProfileUpdateAt,
      latestRequest: user.VerificationRequests[0] ?? null,
    },
  };
});

// ──────────────────────────────────────────────────────────────
// 2. Get active Valid ID types (user-facing — no admin check)
// ──────────────────────────────────────────────────────────────

export type GetActiveValidIDTypes = Awaited<ReturnType<typeof getActiveValidIDTypesAction>>;

export const getActiveValidIDTypesAction = withErrorHandling(async () => {
  await sessionCheck();

  const idTypes = await prisma.validIDType.findMany({
    where: { isActive: true },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      description: true,
      automatedVerification: true,
    },
  });

  return { message: "Valid ID types fetched", data: idTypes };
});

// ──────────────────────────────────────────────────────────────
// 3. Submit a verification request
// ──────────────────────────────────────────────────────────────

interface VerificationDocumentInput {
  validIdTypeId: number;
  idPhotoUrl: string;
  selfieWithIdUrl: string;
  selfieWithoutIdUrl: string;
}

export const submitVerificationRequestAction = withErrorHandling(
  async (documents: VerificationDocumentInput[]) => {
    const session = await sessionCheck();

    if (!documents.length) {
      throw new Error("At least one identity document is required");
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
      select: { id: true, verificationStatus: true, firstName: true, lastName: true },
    });

    // Prevent duplicate submissions if already pending
    if (user.verificationStatus === "PENDING") {
      throw new Error(
        "You already have a pending verification request. Please wait for it to be reviewed."
      );
    }

    // Prevent resubmission if already verified
    if (user.verificationStatus === "VERIFIED") {
      throw new Error("Your account is already verified.");
    }

    // Create the verification request with documents in a transaction
    const request = await prisma.$transaction(async (tx) => {
      const verificationRequest = await tx.verificationRequest.create({
        data: {
          userId: user.id,
          status: "PENDING",
          VerificationDocuments: {
            create: documents.map((doc) => ({
              validIdTypeId: doc.validIdTypeId,
              idPhotoUrl: doc.idPhotoUrl,
              selfieWithIdUrl: doc.selfieWithIdUrl,
              selfieWithoutIdUrl: doc.selfieWithoutIdUrl,
            })),
          },
        },
        select: { id: true, status: true, createdAt: true },
      });

      // Update user status to PENDING
      await tx.user.update({
        where: { id: user.id },
        data: { verificationStatus: "PENDING" },
      });

      return verificationRequest;
    });

    // Notify all super admins about the new verification request
    const superAdminPermission = await prisma.permission.findUnique({
      where: { name: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (superAdminPermission) {
      const adminUsers = await prisma.userPermission.findMany({
        where: { permissionId: superAdminPermission.id },
        select: { userId: true },
      });

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown user";

      await createNotifications(
        adminUsers.map((admin) => ({
          userId: admin.userId,
          type: "VERIFICATION_SUBMITTED" as const,
          title: "New Verification Request",
          message: `${fullName} has submitted an identity verification request for review.`,
          link: "/super-admin/verification",
        }))
      );
    }

    return {
      message: "Verification request submitted successfully. You will be notified once it is reviewed.",
      data: request,
    };
  }
);
