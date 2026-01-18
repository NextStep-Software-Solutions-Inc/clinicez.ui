"use server";
import 'server-only';

import { getImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: { params: Promise<{ imagingStudiesId: string }> }) => {
  const { imagingStudiesId } = await params;
  const study = await getImagingStudyAction(Number(imagingStudiesId));
  return NextResponse.json(study, { status: 200 });
});