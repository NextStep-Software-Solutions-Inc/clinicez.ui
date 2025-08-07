import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { getMedicineAction } from "@/actions/clinics/clinical-record/medicine.action";

export const GET = withJwtAuth(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const medicineId = parseInt(id);

  if (isNaN(medicineId)) {
    return NextResponse.json({ error: "Invalid medicine ID" }, { status: 400 });
  }

  const result = await getMedicineAction(medicineId);
  return NextResponse.json(result, { status: 200 });
});
