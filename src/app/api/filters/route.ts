"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getFilters } from '@actions/filter.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const filters = await getFilters();

  return NextResponse.json(filters, { status: 200 });
});