"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgConsultationConfigAction } from "@actions/consultation/consultation-config.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      organizationId: string;
    }
  }) => {

  const orgUid = params.organizationId;
  const orgConsultationConfig = await getOrgConsultationConfigAction(orgUid)
  return NextResponse.json(orgConsultationConfig, {status: 200});
});
