"use server";
import "server-only";

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getClinicDocumentDefaultTemplatesAction } from "@/actions/clinics/clinic-document-setting.action";

export const GET = withClerkAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ clinicUid: string }> }
  ) => {
    const { clinicUid } = await params;
    const result = await getClinicDocumentDefaultTemplatesAction(clinicUid);
    return NextResponse.json(result, { status: 200 });
  }
);
