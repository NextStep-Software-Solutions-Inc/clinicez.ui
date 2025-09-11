import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { parseObject } from "@/lib/utils";
import {
  getMedicinesAction,
  GetMedicineFilters
} from "@/actions/clinics/clinical-record/medicine.action";

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetMedicineFilters;
  const medicines = await getMedicinesAction(filters);

  return NextResponse.json(medicines, { status: 200 });
});
