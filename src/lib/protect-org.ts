"use server";

import { getOrganizationsAction } from "@actions/organization.action"
import { getSession } from "@auth0/nextjs-auth0"
import { notFound } from "next/navigation";

export const protectOrg = async (orgUid: string) => {
  const session = await getSession()
  const myOrgs = await getOrganizationsAction({userId: session?.user.sub})
  if (!myOrgs.map(org => org.orgId).includes(orgUid)) {
    return notFound()
  }
}