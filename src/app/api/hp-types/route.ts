"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getHPTypesAction } from '@actions/hp-type.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const hpTypes = await getHPTypesAction();

  return NextResponse.json(hpTypes, { status: 200 });
});