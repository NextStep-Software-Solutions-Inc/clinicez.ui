import { NextRequest, NextResponse } from "next/server";
import { getLaboratoryDiagnosticsAction } from "@/actions/clinics/clinical-record/diagnostics.action";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const result = await getLaboratoryDiagnosticsAction(search, limit);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in laboratory diagnostics search:", error);
        return NextResponse.json(
            { status: false, message: "Failed to search diagnostics", data: null },
            { status: 500 }
        );
    }
}
