import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { parseObject } from "@/lib/utils";
import {
  getPrescriptionsAction,
  GetPrescriptionFilters
} from "@/actions/clinics/clinical-record/prescription.action";

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetPrescriptionFilters;
  const prescriptions = await getPrescriptionsAction(filters);

  return NextResponse.json(prescriptions, { status: 200 });
});

