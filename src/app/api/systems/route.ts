"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getSystemsAction } from '@actions/system.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get('orgUid') as string;

  const systems = await getSystemsAction(orgUid);
  return NextResponse.json(systems, { status: 200 });
});