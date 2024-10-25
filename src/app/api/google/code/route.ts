"use server";

import { getGoogleAuthTokens } from "@actions/google/auth.action";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const searchParams = req.nextUrl.searchParams;
  const {code, scope} = Object.fromEntries(searchParams.entries())
  const token = await getGoogleAuthTokens(code, `${baseUrl}/api/google/code`);

  if(token !== null) redirect(`${baseUrl}/settings/integrations`)
  return NextResponse.json(token, { status: 200 });
}