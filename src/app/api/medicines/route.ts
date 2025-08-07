import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { parseObject } from "@/lib/utils";
import {
  getMedicinesAction,
  GetMedicineFilters
} from "@/actions/clinics/clinical-record/medicine.action";

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetMedicineFilters;
  const medicines = await getMedicinesAction(filters);

  return NextResponse.json(medicines, { status: 200 });
});
