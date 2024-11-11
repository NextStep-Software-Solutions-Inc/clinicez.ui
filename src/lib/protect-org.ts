"use server";

import { getCachedSession } from "@actions/session.action";
import { getUserOrganizationsAction } from "@actions/users/user-organization.action";
import { getUserPlansAction } from "@actions/users/user-plan.action";
import { permanentRedirect } from "next/navigation";
import { cache } from "react";

export const protectOrg = cache(async (orgUid: string) => {
  const session = await getCachedSession()
  const myOrgs = await getUserOrganizationsAction({userId: session?.user.sub})
  if (!myOrgs.data.map(org => org.Organization.orgUid).includes(orgUid)) {
    permanentRedirect("/unauthorized")
  }
})
export const isUserOwner = cache(async (userId: string) => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  return session.user.sub === userId;
})

export const isMember = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({userId: session.user.sub});
  return myOrgs.data.some((org) => ["ACTIVE"].includes(org.status));
})

export const isHP = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "HEALTHCARE_PROVIDER" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})

export const isTenant = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "TENANT" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})

export const isOrgAdmin = cache(async (orgUid?:string) => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({
    userId: session.user.sub,
    orgUid
  });
  return myOrgs.data.some((org) => ["ACTIVE"].includes(org.status) && org.OrganizationRole.name.toUpperCase() === "ADMIN");
})

export const isSameOrg = cache(async (userId: string) => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const orgs = await getUserOrganizationsAction({userId: session.user.sub});
  return orgs.data.find((org) => org.Organization.OrganizationMembers.some((user) => user.User.userId === userId));
});