"use server";
import 'server-only';

import { withClerkAuth } from '@middlewares/withClerkAuth';
import { NextRequest, NextResponse } from "next/server";

import { getMedicalCertificateAction } from '@actions/clinics/clinical-record/medical-certificate.action';

export const GET = withClerkAuth(async (req: NextRequest, { params }: { params: Promise<{ medicalCertificateId: string }> }) => {
  const { medicalCertificateId } = await params;
  const certificate = await getMedicalCertificateAction(Number(medicalCertificateId));
  return NextResponse.json(certificate, { status: 200 });
});
