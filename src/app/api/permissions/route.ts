"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { getPermissionsAction } from '@actions/permission.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId') ?? undefined;

  const permissions = await getPermissionsAction(userId);

  return NextResponse.json(permissions, { status: 200 });
});