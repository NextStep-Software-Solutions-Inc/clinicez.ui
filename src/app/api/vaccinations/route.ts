"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { NextRequest, NextResponse } from "next/server";
import { getUserVaccinationsAction } from '@actions/user-vaccination.action';


export const GET = (async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');

  if(!userId) {
    return NextResponse.json({
      success: false,
      response: 'userId is required'
    }, { status: 400 });
  }

  const vaccinations = await getUserVaccinationsAction(userId);

  return NextResponse.json(vaccinations, {
    status: 200
  });
});