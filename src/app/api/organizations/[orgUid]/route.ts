"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationAction } from "@actions/organizations/organization.action";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      orgUid: string;
    }>
  }) => {
    
  const { orgUid } = await params;
  const organization = await getOrganizationAction(orgUid)
  return NextResponse.json(organization, {status: 200});
});
