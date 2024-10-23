"use server";

import { getGoogleAuthTokens } from "@actions/google/auth.action";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const {code, scope} = Object.fromEntries(searchParams.entries())
  const token = await getGoogleAuthTokens(code, "http://localhost:3000/api/google/code");
  return NextResponse.json(token, { status: 200 });
}