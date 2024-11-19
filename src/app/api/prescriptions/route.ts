"use server";
import 'server-only'

import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getPrescriptionsAction } from '@actions/medications/prescription.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const prescriptions = await getPrescriptionsAction(filters);

  return NextResponse.json(prescriptions, { status: 200});
});

