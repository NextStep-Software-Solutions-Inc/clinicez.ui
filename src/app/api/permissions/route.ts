"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getPermissionsAction } from '@actions/permission.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const payload = Object.fromEntries(searchParams.entries());

  const permissions = await getPermissionsAction(payload);
  return NextResponse.json(permissions, { status: 200 });
});