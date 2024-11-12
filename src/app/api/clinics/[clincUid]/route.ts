"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationAction } from "@actions/organizations/organization.action";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      clinicUid: string;
    }
  }) => {
    
  const clinicUid = params.clinicUid;
  const organization = await getOrganizationAction(clinicUid)
  return NextResponse.json(organization, {status: 200});
});
