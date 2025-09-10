"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getPlansAction } from '@actions/plan.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const payload = Object.fromEntries(searchParams.entries());

  const plans = await getPlansAction({
    type: payload.type as "TENANT" | "HEALTHCARE_PROVIDER",
    frequency: payload.frequency as "MONTHLY" | "YEARLY"
  });
  return NextResponse.json(plans, { status: 200 });
});