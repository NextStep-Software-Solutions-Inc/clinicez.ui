import { getPaginatedImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const diagnosticsResult = await getPaginatedImagingDiagnosticsAction({
      search,
      limit,
      offset
    });

    return NextResponse.json({
      status: true,
      data: diagnosticsResult.data,
      message: diagnosticsResult.message
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch imaging diagnostics", data: null, status: false },
      { status: 500 }
    );
  }
});
