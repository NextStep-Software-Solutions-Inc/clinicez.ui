"use server";

import { getCachedSession } from "@actions/session.action";
import { getOrgMembersAction, isOrgHealthcareProviderAction } from "@actions/organizations/org-member.action";
import { getUserPlansAction } from "@actions/users/user-plan.action";
import { hasOrgPermissionAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { cache } from "react";

// Helper function to check organization permission with optional orgUid
const checkOrgPermission = async (permissionName: string, orgUid?: string): Promise<boolean> => {
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");

  const userId = session.user.sub;

  // If no orgUid provided, check if user has permission in ANY organization
  if (!orgUid) {
    const myOrgs = await getOrgMembersAction({ userId });
    if (!myOrgs.data?.data.length) return false;

    // Check if user has the permission in any active organization
    const checks = await Promise.all(
      myOrgs.data.data
        .filter((org) => org.status === "ACTIVE")
        .map((org) => hasOrgPermissionAction({ userId, orgUid: org.Organization.orgUid, permissionName }))
    );
    return checks.some((hasPermission) => hasPermission);
  }

  return await hasOrgPermissionAction({ userId, orgUid, permissionName });
};

export const isOrgHealthcareProvider = cache(async (orgUid?: string) => {
  if (!orgUid) throw new Error("orgUid is required");
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");
  const userId = session.user.sub;
  const isProvider = await isOrgHealthcareProviderAction(userId, orgUid);
  return isProvider;
});

export const isOrgMember = cache(async (orgUid?: string) => {

  const session = await getCachedSession()
  if (!session) throw new Error("No session found");

  const myOrgs = await getOrgMembersAction({ userId: session.user.sub })
  return !!myOrgs.data?.data?.length && myOrgs.data?.data.some(org => ["ACTIVE"].includes(org.status) && (!orgUid || org.Organization.orgUid === orgUid))
})

export const isOrgOwner = cache(async (orgUid?: string) => {
  if (!orgUid) throw new Error("orgUid is required");
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");

  const memberships = await getOrgMembersAction({ userId: session.user.sub, orgUid });
  const data = memberships.data?.data ?? [];
  return data.some(
    (membership) =>
      ["ACTIVE"].includes(membership.status) &&
      membership.OrganizationRole.name.toUpperCase() === "OWNER"
  );
})

export const isUserOwner = cache(async (userId: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");
  return session.user.sub === userId;
})

export const isHP = cache(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "HEALTHCARE_PROVIDER" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})


export const isOrgAdmin = cache(async (orgUid?: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("No session found");
  const myOrgs = await getOrgMembersAction({
    userId: session.user.sub,
    orgUid
  });
  return !!myOrgs.data?.data.some((org) => ["ACTIVE"].includes(org.status) && org.OrganizationRole.name.toUpperCase() === "ADMIN");
})

export const isSameOrg = cache(async (userId: string) => {

  const orgs = await getOrgMembersAction({ userId });
  return !!orgs.data?.data.length

});

export const canViewOrgMembers = cache(async (orgUid?: string) => {
  return checkOrgPermission(PERMISSIONS.ORGANIZATION["READ:ORG:MEMBERS"].name, orgUid);
});

export const canManageOrgMembers = cache(async (orgUid?: string) => {
  return checkOrgPermission(PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name, orgUid);
});