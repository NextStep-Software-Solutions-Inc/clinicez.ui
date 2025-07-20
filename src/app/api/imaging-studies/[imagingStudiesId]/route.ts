"use server";
import 'server-only';

import { getImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: { params: { imagingStudyId: string } }) => {
  const study = await getImagingStudyAction(Number(params.imagingStudyId));
  return NextResponse.json(study, { status: 200 });
});