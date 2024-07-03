"use server";

import { getUserOrganizationsAction } from "@actions/organization.action"
import { getCachedSession } from "@actions/session.action";
import { getUserPlansAction } from "@actions/user-plan.action";
import { notFound } from "next/navigation";
import { cache } from "react";

export const protectOrg = async (orgUid: string) => {
  const session = await getCachedSession()
  const myOrgs = await getUserOrganizationsAction({userId: session?.user.sub})
  if (!myOrgs.map(org => org.Organization.orgId).includes(orgUid)) {
    return notFound()
  }
}
export const isUserOwner = cache(async (userId: string) => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  return session.user.sub === userId;
})

export const isMember = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({userId: session.user.sub});
  return myOrgs.some((org) => ["ACTIVE"].includes(org.status));
})

export const isHP = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "HEALTHCARE_PROVIDER" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})

export const isTenantOwner = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "TENANT" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})

export const isOrgAdmin = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({userId: session.user.sub});
  return myOrgs.some((org) => ["ACTIVE"].includes(org.status) && org.UserRole.name.toUpperCase() === "ADMIN");
})

export const isSameOrg = cache(async (userId: string) => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const orgs = await getUserOrganizationsAction({userId: session.user.sub});
  return orgs.some((org) => org.Organization.Users.some((user) => user.User.userId === userId));
});