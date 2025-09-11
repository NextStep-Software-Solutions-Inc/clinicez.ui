"use server";
import 'server-only';

import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: { params: Promise<{ laboratoryRequestId: string }> }) => {
  const { laboratoryRequestId } = await params;
  const request = await getLaboratoryRequestAction(Number(laboratoryRequestId));
  return NextResponse.json(request, { status: 200 });
});
