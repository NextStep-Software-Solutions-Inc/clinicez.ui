"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgSettingAction } from "@actions/organizations/org-setting.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const orgSetting = await getOrgSettingAction(clinicUid)
  return NextResponse.json(orgSetting, {status: 200});
});
