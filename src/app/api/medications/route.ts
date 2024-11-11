"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { getMedicationsAction } from '@actions/medications/medication.action';
import { parseObject } from '@lib/utils';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const medications = await getMedicationsAction({...filters, clinicId: filters.clinicId as number});

  return NextResponse.json(medications, { status: 200});
});

