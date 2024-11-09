"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getMedicationDrugsAction } from '@actions/medications/medication-drug.action';


export const GET = withJwtAuth(async (req: NextRequest, {params}: {params: {medicationId: string}}) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const medicationDrugs = await getMedicationDrugsAction(Number(params.medicationId));

  return NextResponse.json(medicationDrugs, { status: 200});
});

