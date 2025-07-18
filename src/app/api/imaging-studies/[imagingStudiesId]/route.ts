"use server";
import 'server-only';

import { getImagingStudiesAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: { params: { imagingStudiesId: string } }) => {
  const { imagingStudiesId } = params;
  const studies = await getImagingStudiesAction({ consultationTicketId: Number(imagingStudiesId) });
  return NextResponse.json(studies, { status: 200 });
});