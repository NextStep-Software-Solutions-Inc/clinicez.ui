"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgSettingAction } from "@actions/organizations/org-setting.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      orgUid: string;
    }>
  }) => {

  const { orgUid } = await params;
  const orgSetting = await getOrgSettingAction(orgUid)
  return NextResponse.json(orgSetting, {status: 200});
});
