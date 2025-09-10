import { getLaboratoryDiagnosticsAction } from "@/actions/clinics/clinical-record/diagnostics.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest) => {
  try {
    const diagnosticsResult = await getLaboratoryDiagnosticsAction();
    return NextResponse.json(diagnosticsResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch laboratory diagnostics", data: null, status: false },
      { status: 500 }
    );
  }
});
