"use server";
import 'server-only'

import { withClerkAuth } from '@middlewares/withClerkAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getDrugsAction } from '@actions/medications/drug.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const drugs = await getDrugsAction(filters);

  return NextResponse.json(drugs, { status: 200});
});

