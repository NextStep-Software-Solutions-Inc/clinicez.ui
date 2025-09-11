"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getOrgProgramsAction } from '@actions/organizations/org-program.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({
      success: false,
      response: 'orgId is required'
    }, { status: 400 });
  }

  const orgProgram = await getOrgProgramsAction(orgId);

  return NextResponse.json(orgProgram, {
    status: 200
  });
});