"use server";
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getOrgCollegesAction } from '@actions/organizations/org-college.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get('orgUid');

  if (!orgUid) {
    return NextResponse.json({
      success: false,
      response: 'orgUid is required'
    }, { status: 400 });
  }

  const orgProgram = await getOrgCollegesAction(orgUid);

  return NextResponse.json(orgProgram, {
    status: 200
  });
});