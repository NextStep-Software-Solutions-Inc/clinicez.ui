import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { parseObject } from "@/lib/utils";
import {
  getPrescriptionsAction,
  GetPrescriptionFilters
} from "@/actions/clinics/clinical-record/prescription.action";

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetPrescriptionFilters;
  const prescriptions = await getPrescriptionsAction(filters);

  return NextResponse.json(prescriptions, { status: 200 });
});

