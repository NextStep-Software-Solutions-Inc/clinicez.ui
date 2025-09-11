"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgRoleInitialPermissionsAction } from "@/actions/org-role-initial-permission.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      orgUid: string;
    }>
  }) => {

  const { orgUid } = await params;
  const searchParams = req.nextUrl.searchParams
  const orgRoleId = Number(searchParams.get("orgRoleId"))
  const orgRoleInitialPermissions = await getOrgRoleInitialPermissionsAction({
    orgRoleId,
    orgUid
  })
  return NextResponse.json(orgRoleInitialPermissions, {status: 200});
});
