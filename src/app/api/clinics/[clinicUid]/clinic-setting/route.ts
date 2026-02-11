"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicSettingAction } from "@actions/clinics/clinic-setting.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const clinicSetting = await getClinicSettingAction(clinicUid)
  return NextResponse.json(clinicSetting, {status: 200});
});
