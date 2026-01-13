import { NextRequest, NextResponse } from "next/server";
import { searchImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("q") || "";
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const result = await searchImagingDiagnosticsAction(search, limit);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in imaging diagnostics search:", error);
        return NextResponse.json(
            { status: false, message: "Failed to search diagnostics", data: null },
            { status: 500 }
        );
    }
}
