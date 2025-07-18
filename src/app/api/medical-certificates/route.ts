"use server";
import 'server-only';

import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';

import { getMedicalCertificatesAction, GetMedicalCertificateFilters } from '@actions/clinics/clinical-record/medical-certificate.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const parsed = parseObject(Object.fromEntries(searchParams.entries()));
  const filters: GetMedicalCertificateFilters = {
    clinicUid: parsed.clinicUid as string,
    patientId: parsed.patientId !== undefined ? Number(parsed.patientId) : undefined,
    consultationTicketId: parsed.consultationTicketId !== undefined ? Number(parsed.consultationTicketId) : undefined,
    hpId: parsed.hpId !== undefined ? Number(parsed.hpId) : undefined,
    search: parsed.search as string | undefined,
    pageSize: parsed.pageSize !== undefined ? Number(parsed.pageSize) : undefined,
    pageNumber: parsed.pageNumber !== undefined ? Number(parsed.pageNumber) : undefined,
    distinct: parsed.distinct as GetMedicalCertificateFilters['distinct'] | undefined,
  };
  if (!filters.clinicUid) {
    return NextResponse.json({ message: 'Missing required clinicUid' }, { status: 400 });
  }
  const certificates = await getMedicalCertificatesAction(filters);
  return NextResponse.json(certificates, { status: 200 });
});
