"use server";

import { getClinicsAction } from "@/actions/clinics/clinic.action";
import { parseObject } from "@/lib/utils";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest) => {

  const searchParams = new URLSearchParams(req.nextUrl.search);
  const filters = parseObject(Object.fromEntries(searchParams.entries()));

  const clinics = await getClinicsAction(filters);
  return NextResponse.json(clinics, {status: 200});
});
  