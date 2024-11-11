"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getActionsAction } from '@actions/consultation/action.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const actions = await getActionsAction();

  return NextResponse.json(actions, { status: 200 });
});