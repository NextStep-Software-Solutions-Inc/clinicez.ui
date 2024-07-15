"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { NextRequest, NextResponse } from "next/server";
import { getUserDisabilitiesAction } from '@actions/user-disability.action';


export const GET = (async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');

  if(!userId) {
    return NextResponse.json({
      success: false,
      response: 'userId is required'
    }, { status: 400 });
  }

  const disabilities = await getUserDisabilitiesAction(userId);

  return NextResponse.json(disabilities, {
    status: 200
  });
});