import { getPaginatedImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest) => {
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

    if (!diagnosticsResult.data) {
      return NextResponse.json({
        status: false,
        data: { data: [], total: 0, message: "No data available" }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      data: {
        data: diagnosticsResult.data.diagnostics,
        total: diagnosticsResult.data.total,
        message: diagnosticsResult.message
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch imaging diagnostics", data: null, status: false },
      { status: 500 }
    );
  }
});
