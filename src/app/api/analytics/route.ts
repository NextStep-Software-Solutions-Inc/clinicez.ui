"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getDailyOrgMembershipRequestAction } from '@actions/dashboard/analytics.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgId = searchParams.get('orgId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if(!orgId || !startDate || !endDate) {
    return NextResponse.json({
      success: false,
      response: 'orgId, startDate, and endDate are required'
    }, { status: 400 });
  }

  const orgDailyRequests = await getDailyOrgMembershipRequestAction(orgId, startDate, endDate);
  return NextResponse.json(
    orgDailyRequests.map(data => ({
      ...data,
      total_requests: data.total_male_request + data.total_female_request
    })),
    {
      status: 200
    }
  );
});