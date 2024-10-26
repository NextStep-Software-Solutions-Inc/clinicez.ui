"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { UserOrganizationStatus } from '@prisma/common/client';
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getUserOrganizationsAction } from '@actions/users/user-organization.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const filters = Object.fromEntries(searchParams.entries());
  const userOrganizations = await getUserOrganizationsAction(filters);
  return NextResponse.json(userOrganizations, {
    status: 200
  });
});