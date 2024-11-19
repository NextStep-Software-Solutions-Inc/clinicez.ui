"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicAction } from "@/actions/clinics/clinic.action";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      clinicUid: string;
    }
  }) => {
  const clinicUid = params.clinicUid;
  
  const organization = await getClinicAction(clinicUid)
  return NextResponse.json(organization, {status: 200});
});
