"use server";
import 'server-only';

import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextRequest, NextResponse } from "next/server";

import { getMedicalCertificateAction } from '@actions/clinics/clinical-record/medical-certificate.action';

export const GET = withJwtAuth(async (req: NextRequest, { params }: { params: { medicalCertificateId: string } }) => {
  const { medicalCertificateId } = params;
  const certificate = await getMedicalCertificateAction(Number(medicalCertificateId));
  return NextResponse.json(certificate, { status: 200 });
});
