"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { UserOrganizationStatus } from '@prisma/common/client';
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getUserOrganizationsAction } from '../../../actions/user-organization.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');
  const orgId = searchParams.get('organizationId');
  const roleId = searchParams.get('roleId');
  const status = searchParams.get('status');
  const pageSize = searchParams.get('pageSize');
  const pageNumber = searchParams.get('pageNumber');

  const disabilities = await getUserOrganizationsAction({
    userId,
    orgId,
    roleId : roleId ? parseInt(roleId) : undefined,
    status : status as UserOrganizationStatus,
    pageSize: pageSize ? parseInt(pageSize) : undefined,
    pageNumber: pageNumber ? parseInt(pageNumber) : undefined
  });

  return NextResponse.json(disabilities, {
    status: 200
  });
});