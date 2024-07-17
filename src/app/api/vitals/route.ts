"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getUserVitalSignsAction } from '@actions/vitals.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');

  if(!userId) {
    return NextResponse.json({
      success: false,
      response: 'userId is required'
    }, { status: 400 });
  }

  const userVitalSigns = await getUserVitalSignsAction(userId);

  return NextResponse.json(userVitalSigns, {
    status: 200
  });
});