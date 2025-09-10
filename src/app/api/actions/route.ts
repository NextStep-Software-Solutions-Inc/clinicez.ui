"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from '@middlewares/withClerkAuth';
import { getActionsAction } from '@actions/consultation/action.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const actions = await getActionsAction();

  return NextResponse.json(actions, { status: 200 });
});