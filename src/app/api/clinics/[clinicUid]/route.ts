"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicAction } from "@/actions/clinics/clinic.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {
  const { clinicUid } = await params;
  
  const clinic = await getClinicAction(clinicUid)
  return NextResponse.json(clinic, {status: 200});
});
