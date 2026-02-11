"use client";

import { usePermissions } from "./usePermission";
import { useMemo } from "react";

/**
 * Hook to check if the current user has specific permissions
 * This is useful for showing/hiding UI elements based on permissions
 */
export const useHasPermission = (
  userId: string | undefined,
  permissionNames: string[],
  type?: "USER" | "CLINIC" | "ORGANIZATION"
) => {
  const { data: permissions, isLoading, error } = usePermissions({ userId, type });

  const hasPermission = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return false;

    // Check if user has ALL specified permissions
    return permissionNames.every((permissionName) =>
      permissions.some((p) => p.name === permissionName)
    );
  }, [permissions, permissionNames]);

  const hasAnyPermission = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return false;

    // Check if user has AT LEAST ONE of the specified permissions
    return permissionNames.some((permissionName) =>
      permissions.some((p) => p.name === permissionName)
    );
  }, [permissions, permissionNames]);

  return {
    hasPermission,
    hasAnyPermission,
    isLoading,
    error,
    permissions,
  };
};

/**
 * Hook to check if user has permission to view their own resource vs all resources
 * Returns appropriate permission state for UI rendering
 */
export const useResourcePermission = (
  userId: string | undefined,
  targetUserId: string | undefined,
  permissionAll: string,
  permissionOwn: string,
  type?: "CLINIC" | "ORGANIZATION"
) => {
  const { data: permissions, isLoading } = usePermissions({ userId, type });

  const canAccess = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return false;

    const isOwnResource = userId === targetUserId;
    const hasAllPermission = permissions.some((p) => p.name === permissionAll);
    const hasOwnPermission = permissions.some((p) => p.name === permissionOwn);

    // Can access if:
    // 1. User has permission to access all resources, OR
    // 2. User is accessing their own resource AND has permission for own resources
    return hasAllPermission || (isOwnResource && hasOwnPermission);
  }, [permissions, userId, targetUserId, permissionAll, permissionOwn]);

  return {
    canAccess,
    isLoading,
    permissions,
  };
};
