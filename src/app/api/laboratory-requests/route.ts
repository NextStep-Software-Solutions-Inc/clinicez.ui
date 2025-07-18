"use server";
import 'server-only';

import { getLaboratoryRequestsAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const filters = {
    clinicUid: searchParams.get('clinicUid') || undefined,
    patientId: searchParams.get('patientId') ? Number(searchParams.get('patientId')) : undefined,
    hpId: searchParams.get('hpId') ? Number(searchParams.get('hpId')) : undefined,
    status: searchParams.get('status') || undefined,
    consultationTicketId: searchParams.get('consultationTicketId') ? Number(searchParams.get('consultationTicketId')) : undefined,
  };

  try {
    const requestsResult = await getLaboratoryRequestsAction(filters);
    return NextResponse.json(requestsResult, { status: 200 });
  } catch (error) {
    console.error("Error fetching laboratory requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch laboratory requests", data: null, status: false },
      { status: 500 }
    );
  }
});
