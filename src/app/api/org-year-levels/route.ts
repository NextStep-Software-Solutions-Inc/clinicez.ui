"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationYearLevelsAction } from '@actions/organizations/org-year-level.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({
      success: false,
      response: 'orgId is required'
    }, { status: 400 });
  }

  const orgYearLevel = await getOrganizationYearLevelsAction(orgId);

  return NextResponse.json(orgYearLevel, {
    status: 200
  });
});