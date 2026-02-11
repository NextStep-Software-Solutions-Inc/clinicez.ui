"use server";

import { sessionCheck } from "./auth";
import { hasOrgPermissionAction, hasClinicPermissionAction } from "@/actions/permission.action";
import prisma from "./prisma";

/**
 * Permission checking utilities for server actions
 */

export class PermissionError extends Error {
  constructor(message: string, public permissionName?: string, public context?: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Check if a user has a specific USER-level permission
 * Throws PermissionError if the check fails
 */
export async function requireUserPermission(
  userId: string,
  permissionName: string,
  actionDescription?: string
): Promise<void> {
  try {
    const permission = await prisma.permission.findFirst({
      where: {
        name: permissionName,
        isActive: true,
        type: "USER",
        UserPermissions: {
          some: {
            User: {
              userId
            }
          }
        }
      }
    });

    if (!permission) {
      throw new PermissionError(
        actionDescription 
          ? `Permission denied: ${actionDescription}. Required permission: ${permissionName}`
          : `Permission denied. Required permission: ${permissionName}`,
        permissionName,
        "USER"
      );
    }
  } catch (error) {
    if (error instanceof PermissionError) {
      throw error;
    }
    console.error("Error checking user permission:", error);
    throw new PermissionError(
      `Failed to verify permission: ${permissionName}`,
      permissionName,
      "USER"
    );
  }
}

/**
 * Check if the current user has a specific organization permission
 * Throws PermissionError if the check fails
 */
export async function requireOrgPermission(
  userId: string,
  orgUid: string,
  permissionName: string,
  actionDescription?: string
): Promise<void> {
  const hasPermission = await hasOrgPermissionAction({ userId, orgUid, permissionName });
  
  if (!hasPermission) {
    throw new PermissionError(
      actionDescription 
        ? `Permission denied: ${actionDescription}. Required permission: ${permissionName}`
        : `Permission denied. Required permission: ${permissionName}`,
      permissionName,
      "ORGANIZATION"
    );
  }
}

/**
 * Check if the current user has a specific clinic permission
 * Throws PermissionError if the check fails
 */
export async function requireClinicPermission(
  userId: string,
  clinicUid: string,
  permissionName: string,
  actionDescription?: string
): Promise<void> {
  const hasPermission = await hasClinicPermissionAction({ userId, clinicUid, permissionName });
  
  if (!hasPermission) {
    throw new PermissionError(
      actionDescription 
        ? `Permission denied: ${actionDescription}. Required permission: ${permissionName}`
        : `Permission denied. Required permission: ${permissionName}`,
      permissionName,
      "CLINIC"
    );
  }
}

/**
 * Check if the current user has at least one of the specified organization permissions
 * Throws PermissionError if none of the permissions are granted
 */
export async function requireAnyOrgPermission(
  userId: string,
  orgUid: string,
  permissionNames: string[],
  actionDescription?: string
): Promise<void> {
  const checks = await Promise.all(
    permissionNames.map(permissionName => 
      hasOrgPermissionAction({ userId, orgUid, permissionName })
    )
  );
  
  const hasAnyPermission = checks.some(result => result);
  
  if (!hasAnyPermission) {
    throw new PermissionError(
      actionDescription 
        ? `Permission denied: ${actionDescription}. Required one of: ${permissionNames.join(", ")}`
        : `Permission denied. Required one of: ${permissionNames.join(", ")}`,
      permissionNames.join(","),
      "ORGANIZATION"
    );
  }
}

/**
 * Check if the current user has at least one of the specified clinic permissions
 * Throws PermissionError if none of the permissions are granted
 */
export async function requireAnyClinicPermission(
  userId: string,
  clinicUid: string,
  permissionNames: string[],
  actionDescription?: string
): Promise<void> {
  const checks = await Promise.all(
    permissionNames.map(permissionName => 
      hasClinicPermissionAction({ userId, clinicUid, permissionName })
    )
  );
  
  const hasAnyPermission = checks.some(result => result);
  
  if (!hasAnyPermission) {
    throw new PermissionError(
      actionDescription 
        ? `Permission denied: ${actionDescription}. Required one of: ${permissionNames.join(", ")}`
        : `Permission denied. Required one of: ${permissionNames.join(", ")}`,
      permissionNames.join(","),
      "CLINIC"
    );
  }
}

/**
 * Helper to check if user is accessing their own resource
 * Returns true if the resource belongs to the current user
 */
export async function isOwnResource(targetUserId: string): Promise<boolean> {
  const session = await sessionCheck();
  return session.user.sub === targetUserId;
}

/**
 * Check permission with ownership fallback
 * Allows action if user has permission OR is accessing their own resource
 */
export async function requirePermissionOrOwnership(
  userId: string,
  clinicUid: string,
  targetUserId: string,
  permissionNameAll: string,
  permissionNameOwn: string,
  actionDescription?: string
): Promise<void> {
  const isOwn = await isOwnResource(targetUserId);
  
  if (isOwn) {
    // Check if user has permission to modify their own resource
    const hasOwnPermission = await hasClinicPermissionAction({ 
      userId, 
      clinicUid, 
      permissionName: permissionNameOwn 
    });
    
    if (hasOwnPermission) {
      return;
    }
  }
  
  // Check if user has permission to modify any resource
  const hasAllPermission = await hasClinicPermissionAction({ 
    userId, 
    clinicUid, 
    permissionName: permissionNameAll 
  });
  
  if (!hasAllPermission) {
    throw new PermissionError(
      actionDescription 
        ? `Permission denied: ${actionDescription}. Required permission: ${permissionNameAll} or ${permissionNameOwn} for own records`
        : `Permission denied. Required permission: ${permissionNameAll} or ${permissionNameOwn} for own records`,
      `${permissionNameAll},${permissionNameOwn}`,
      "CLINIC"
    );
  }
}
