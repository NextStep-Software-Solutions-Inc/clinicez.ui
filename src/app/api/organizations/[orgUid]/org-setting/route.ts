"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgSettingAction } from "@actions/organizations/org-setting.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      orgUid: string;
    }
  }) => {

  const orgUid = params.orgUid;
  const orgSetting = await getOrgSettingAction(orgUid)
  return NextResponse.json(orgSetting, {status: 200});
});
