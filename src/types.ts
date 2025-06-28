export type PermissionType = "USER" | "ORGANIZATION" | "CLINIC";
export type OrganizationMemberStatus = "ACTIVE" | "SUSPENDED" | "PENDiNG" | "INACTIVE";
export type ClinicMemberStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "INACTIVE";
export type Severity = "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
export type HealthConditionStatus = "RESOLVED" | "UNRESOLVED";

/**
 * @deprecated This type is obsolete and should no longer be used
 */
export type AppRouterPageRouteOpts = {
  searchParams?: Record<string, string | string[] | undefined>;
    params?: Record<string, string | string[] | undefined>;
}