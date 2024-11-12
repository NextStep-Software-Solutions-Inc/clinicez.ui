"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicConsultationConfigAction } from "@actions/consultation/consultation-config.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      clinicUid: string;
    }
  }) => {

  const clinicUid = params.clinicUid;
  const orgConsultationConfig = await getClinicConsultationConfigAction(clinicUid)
  return NextResponse.json(orgConsultationConfig, {status: 200});
});
