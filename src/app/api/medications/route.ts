"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getMedicationsAction } from '@actions/medications/medication.action';
import { parseObject } from '@lib/utils';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const medications = await getMedicationsAction({ ...filters, clinicUid: filters.clinicUid as string });

  return NextResponse.json(medications, { status: 200 });
});

