"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicConsultationConfigAction } from "@actions/consultation/consultation-config.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const orgConsultationConfig = await getClinicConsultationConfigAction(clinicUid)
  return NextResponse.json(orgConsultationConfig, {status: 200});
});
