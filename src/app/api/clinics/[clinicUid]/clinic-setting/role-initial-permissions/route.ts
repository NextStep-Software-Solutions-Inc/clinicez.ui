"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicRoleInitialPermissionsAction } from "@/actions/clinic-role-initial-permission.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const searchParams = req.nextUrl.searchParams
  const clinicRoleId = Number(searchParams.get("clinicRoleId"))
  const clinicRoleInitialPermissions = await getClinicRoleInitialPermissionsAction({
    clinicRoleId,
    clinicUid
  })
  return NextResponse.json(clinicRoleInitialPermissions, {status: 200});
});
