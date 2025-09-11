"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getUserIllnessesAction } from '@actions/users/user-illness.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
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