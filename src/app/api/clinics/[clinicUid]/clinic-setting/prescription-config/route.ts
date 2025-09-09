"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicPrescriptionConfigAction } from "@/actions/medications/prescription-config.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {

  const { clinicUid } = await params;
  const clinicPrescriptionConfig = await getClinicPrescriptionConfigAction(clinicUid)
  return NextResponse.json(clinicPrescriptionConfig, {status: 200});
});
