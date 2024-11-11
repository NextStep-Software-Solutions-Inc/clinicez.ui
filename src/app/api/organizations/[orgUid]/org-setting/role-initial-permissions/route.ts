"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgRoleInitialPermissionsAction } from "@/actions/org-role-initial-permission.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      orgUid: string;
    }
  }) => {

  const orgUid = params.orgUid;
  const searchParams = req.nextUrl.searchParams
  const orgRoleId = Number(searchParams.get("orgRoleId"))
  const orgRoleInitialPermissions = await getOrgRoleInitialPermissionsAction({
    orgRoleId,
    orgUid
  })
  return NextResponse.json(orgRoleInitialPermissions, {status: 200});
});
