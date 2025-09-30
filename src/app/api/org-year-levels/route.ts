"use server";
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationYearLevelsAction } from '@actions/organizations/org-year-level.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get('orgUid');

  if (!orgUid) {
    return NextResponse.json({
      success: false,
      response: 'orgUid is required'
    }, { status: 400 });
  }

  const orgYearLevel = await getOrganizationYearLevelsAction(orgUid);

  return NextResponse.json(orgYearLevel, {
    status: 200
  });
});