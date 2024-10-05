"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgAppointmentConfigAction } from "@actions/appointments/appointment-config.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      organizationId: string;
    }
  }) => {

  const orgUid = params.organizationId;
  const orgAppointmentConfig = await getOrgAppointmentConfigAction(orgUid)
  return NextResponse.json(orgAppointmentConfig, {status: 200});
});
