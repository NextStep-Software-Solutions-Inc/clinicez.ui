"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { getUserAllergiesAction } from '@actions/user-allergy.action';
import { withJwtAuth } from '@middlewares/withJwtAuth';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');

  if(!userId) {
    return NextResponse.json({
      success: false,
      response: 'userId is required'
    }, { status: 400 });
  }

  const allergies = await getUserAllergiesAction(userId);

  return NextResponse.json(allergies, {
    status: 200
  });
});