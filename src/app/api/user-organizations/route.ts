"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getOrgMembersAction } from '@actions/organizations/org-member.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const filters = Object.fromEntries(searchParams.entries());
  const userOrganizations = await getOrgMembersAction(filters);
  return NextResponse.json(userOrganizations, {
    status: 200
  });
});