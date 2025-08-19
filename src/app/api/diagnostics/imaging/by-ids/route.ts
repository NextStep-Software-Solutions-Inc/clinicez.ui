import { NextRequest, NextResponse } from "next/server";
import { getImagingDiagnosticsByIdsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        message: "Valid IDs array is required",
        data: []
      });
    }

    // Validate that all IDs are numbers
    const validIds = ids.filter((id) => typeof id === "number" && !isNaN(id));

    if (validIds.length === 0) {
      return NextResponse.json({
        message: "No valid IDs provided",
        data: []
      });
    }

    const result = await getImagingDiagnosticsByIdsAction(validIds);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in get diagnostics by IDs API:", error);
    return NextResponse.json(
      { message: "Failed to fetch diagnostics", data: [] },
      { status: 500 }
    );
  }
}
