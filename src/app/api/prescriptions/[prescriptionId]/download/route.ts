"use server";
import 'server-only'

import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getPrescriptionAction } from '@actions/medications/prescription.action';


export const GET = withJwtAuth(async (req: NextRequest, {params}: {params: Promise<{prescriptionId: number}>}) => {
  const { prescriptionId } = await params;
  
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const prescription = await getPrescriptionAction(prescriptionId);

  return NextResponse.json(prescription, { status: 200});
});

