"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { getMedicationAction } from '@actions/medications/medication.action';
import { parseObject } from '@lib/utils';


export const GET = withJwtAuth(async (req: NextRequest, {params}: {params: {medicationId: string}}) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const medication = await getMedicationAction(Number(params.medicationId), {clinicUid: filters.clinicUid as string});

  return NextResponse.json(medication, { status: 200});
});

