"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicAppointmentConfigAction } from "@actions/appointments/appointment-config.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      clinicUid: string;
    }
  }) => {

  const clinicUid = params.clinicUid;
  const orgAppointmentConfig = await getClinicAppointmentConfigAction(clinicUid)
  return NextResponse.json(orgAppointmentConfig, {status: 200});
});
