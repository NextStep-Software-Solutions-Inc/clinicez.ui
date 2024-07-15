"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { NextRequest, NextResponse } from "next/server";
import { getUserIllnessesAction } from '@actions/user-illness.action';


export const GET = (async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');

  if(!userId) {
    return NextResponse.json({
      success: false,
      response: 'userId is required'
    }, { status: 400 });
  }

  const illnesses = await getUserIllnessesAction(userId);

  return NextResponse.json(illnesses, {
    status: 200
  });
});