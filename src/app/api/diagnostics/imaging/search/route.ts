import { NextRequest, NextResponse } from "next/server";
import { searchImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query.trim()) {
      return NextResponse.json({
        message: "Search query is required",
        data: []
      });
    }

    const result = await searchImagingDiagnosticsAction(query, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in search diagnostics API:", error);
    return NextResponse.json(
      { message: "Failed to search diagnostics", data: [] },
      { status: 500 }
    );
  }
}
