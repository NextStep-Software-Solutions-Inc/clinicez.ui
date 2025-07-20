"use server";
import 'server-only';

import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: { params: { laboratoryRequestId: string } }) => {
  const request = await getLaboratoryRequestAction(Number(params.laboratoryRequestId));
  return NextResponse.json(request, { status: 200 });
});
