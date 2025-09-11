"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getMedicationDrugsAction } from '@actions/medications/medication-drug.action';


export const GET = withClerkAuth(async (req: NextRequest, {params}: {params: Promise<{medicationId: string}>}) => {
  const searchParams = req.nextUrl.searchParams
  const { medicationId } = await params

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const medicationDrugs = await getMedicationDrugsAction(Number(medicationId));

  return NextResponse.json(medicationDrugs, { status: 200});
});

