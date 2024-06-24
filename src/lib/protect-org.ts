"use server";

import { getUserOrganizationsAction } from "@actions/organization.action"
import { getUserPlansAction } from "@actions/user-plan.action";
import { getSession } from "@auth0/nextjs-auth0"
import { notFound } from "next/navigation";

export const protectOrg = async (orgUid: string) => {
  const session = await getSession()
  const myOrgs = await getUserOrganizationsAction({userId: session?.user.sub})
  if (!myOrgs.map(org => org.Organization.orgId).includes(orgUid)) {
    return notFound()
  }
}

export const isMember = async () => {
  const session = await getSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({userId: session.user.sub});
  return myOrgs.some((org) => ["ACTIVE"].includes(org.status));
}

export const isHP = async () => {
  const session = await getSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "HEALTHCARE_PROVIDER" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
}

export const isTenantOwner = async () => {
  const session = await getSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "TENANT" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
}

export const isOrgAdmin = async () => {
  const session = await getSession();
  if(!session) throw new Error("No session found");
  const myOrgs = await getUserOrganizationsAction({userId: session.user.sub});
  return myOrgs.some((org) => ["ACTIVE"].includes(org.status) && org.UserRole.name.toUpperCase() === "ADMIN");
}