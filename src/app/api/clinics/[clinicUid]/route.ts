"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicAction } from "@/actions/clinics/clinic.action";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      clinicUid: string;
    }>
  }) => {
  const { clinicUid } = await params;
  
  const clinic = await getClinicAction(clinicUid)
  return NextResponse.json(clinic, {status: 200});
});
