"use server";
import 'server-only';

import { getLaboratoryRequestsAction, GetLaboratoryRequestsFilters } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@/lib/utils';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetLaboratoryRequestsFilters;
  const requests = await getLaboratoryRequestsAction(filters);

  return NextResponse.json(requests, { status: 200 });
});
