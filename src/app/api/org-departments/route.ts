"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getOrgDepartmentAction } from '@actions/organizations/org-department.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgId = searchParams.get('orgId');

  if(!orgId) {
    return NextResponse.json({
      success: false,
      response: 'orgId is required'
    }, { status: 400 });
  }

  const orgDepartment = await getOrgDepartmentAction(orgId);

  return NextResponse.json(orgDepartment, {
    status: 200
  });
});