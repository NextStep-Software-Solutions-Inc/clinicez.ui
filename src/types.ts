export type PermissionType = "USER" | "ORGANIZATION" | "CLINIC";
export type OrganizationMemberStatus = "ACTIVE" | "SUSPENDED" | "PENDiNG" | "INACTIVE";
export type ClinicMemberStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "INACTIVE";
export type Severity = "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
export type HealthConditionStatus = "RESOLVED" | "UNRESOLVED";

/**
 * @deprecated This type is obsolete and should no longer be used
 * Updated for Next.js 15.3.4 compatibility - params and searchParams are now Promise-based
 */
export type AppRouterPageRouteOpts = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string | string[] | undefined>>;
}