"use server";
import "server-only";

import { getHeartStationRequestsAction, GetHeartStationRequestsFilters } from "@/actions/clinics/clinical-record/heart-station.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from "@/lib/utils";

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetHeartStationRequestsFilters;
  const requests = await getHeartStationRequestsAction(filters);
  return NextResponse.json(requests, { status: 200 });
});
