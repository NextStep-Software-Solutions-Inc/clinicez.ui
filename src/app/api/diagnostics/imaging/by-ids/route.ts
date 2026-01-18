import { getImagingDiagnosticsByIdsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const POST = withClerkAuth(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                {
                    status: false,
                    message: "Invalid request: ids must be an array",
                    data: null,
                },
                { status: 400 }
            );
        }

        const result = await getImagingDiagnosticsByIdsAction(ids);

        if (!result.data) {
            return NextResponse.json(
                {
                    status: false,
                    message: result.message || "Failed to fetch imaging diagnostics",
                    data: null,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: true,
            message: "Imaging diagnostics retrieved successfully",
            data: result.data,
        });
    } catch (error) {
        console.error("Error fetching imaging diagnostics:", error);
        return NextResponse.json(
            {
                status: false,
                message: error instanceof Error ? error.message : "Internal server error",
                data: null,
            },
            { status: 500 }
        );
    }
});
