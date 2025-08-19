import { NextRequest, NextResponse } from "next/server";
import { getPaginatedImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const category = searchParams.get("category") || undefined;

    const result = await getPaginatedImagingDiagnosticsAction({
      search,
      limit,
      offset,
      category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in paginated diagnostics API:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch diagnostics",
        data: { diagnostics: [], total: 0, hasMore: false }
      },
      { status: 500 }
    );
  }
}
