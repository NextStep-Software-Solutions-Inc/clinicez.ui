"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { getPlansAction } from '@actions/plan.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const payload = Object.fromEntries(searchParams.entries());

  const plans = await getPlansAction({
    type: payload.type as "TENANT" | "HEALTHCARE_PROVIDER",
    frequency: payload.frequency as "MONTHLY" | "YEARLY"
  });
  return NextResponse.json(plans, { status: 200 });
});