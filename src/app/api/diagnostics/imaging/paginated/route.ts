import { NextRequest, NextResponse } from "next/server";
import { getPaginatedImagingDiagnosticsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { search = "", limit = 50, offset = 0 } = body;

        const result = await getPaginatedImagingDiagnosticsAction({
            search,
            limit,
            offset,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in paginated imaging diagnostics:", error);
        return NextResponse.json(
            { status: false, message: "Failed to retrieve diagnostics", data: null },
            { status: 500 }
        );
    }
}
