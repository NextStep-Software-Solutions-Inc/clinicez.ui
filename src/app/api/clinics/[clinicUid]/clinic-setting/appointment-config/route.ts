"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicAppointmentConfigAction } from "@actions/appointments/appointment-config.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const orgAppointmentConfig = await getClinicAppointmentConfigAction(clinicUid)
  return NextResponse.json(orgAppointmentConfig, {status: 200});
});
