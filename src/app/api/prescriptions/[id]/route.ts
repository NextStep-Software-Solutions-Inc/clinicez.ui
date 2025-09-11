import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { getPrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action";

export const GET = withClerkAuth(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const prescriptionId = parseInt(id);

  if (isNaN(prescriptionId)) {
    return NextResponse.json({ error: "Invalid prescription ID" }, { status: 400 });
  }

  const result = await getPrescriptionAction(prescriptionId);
  return NextResponse.json(result, { status: 200 });
});
