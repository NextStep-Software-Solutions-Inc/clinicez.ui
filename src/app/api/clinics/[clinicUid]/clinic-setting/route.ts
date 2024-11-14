"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgSettingAction } from "@actions/organizations/org-setting.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      clinicUid: string;
    }
  }) => {

  const clinicUid = params.clinicUid;
  const orgSetting = await getOrgSettingAction(clinicUid)
  return NextResponse.json(orgSetting, {status: 200});
});
