"use server";
import 'server-only';

import { withClerkAuth } from '@middlewares/withClerkAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';

import { getMedicalCertificatesAction, GetMedicalCertificateFilters } from '@actions/clinics/clinical-record/medical-certificate.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetMedicalCertificateFilters;
  const certificates = await getMedicalCertificatesAction(filters);

  return NextResponse.json(certificates, { status: 200 });
});