"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicPrescriptionConfigAction } from "@/actions/medications/prescription-config.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const clinicPrescriptionConfig = await getClinicPrescriptionConfigAction(clinicUid)
  return NextResponse.json(clinicPrescriptionConfig, {status: 200});
});
