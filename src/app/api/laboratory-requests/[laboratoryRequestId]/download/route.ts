"use server";
import 'server-only';

import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: { params: { laboratoryRequestId: string } }) => {
  const { laboratoryRequestId } = params;
  const response = await getLaboratoryRequestAction(Number(laboratoryRequestId));

  if (!response.data) {
    return NextResponse.json({ message: "Laboratory request not found" }, { status: 404 });
  }

  const request = response.data;
  const patient = request.ClinicPatient?.Patient;
  const address = patient?.UserAddresses?.[0];
  const hp = request.HealthCareProvider;

  // Calculate age from DOB
  const calculateAge = (dob: string | Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format data for PDF template
  const pdfData = {
    serialNumber: request.serialNumber,
    patientName: `${patient?.firstName || ''} ${patient?.middleName || ''} ${patient?.lastName || ''}`.trim(),
    age: patient?.dob ? calculateAge(patient.dob) : 'N/A',
    gender: patient?.gender || 'N/A',
    address: address ? `${address.address || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.trim() : 'N/A',
    birthdate: patient?.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A',
    requestDate: new Date(request.createdAt).toLocaleDateString(),
    impression: request.impression || '',
    doctorName: hp?.HPProfile ? `${hp.HPProfile.title || ''} ${hp.HPProfile.name || ''} ${hp.HPProfile.suffix || ''}`.trim() : 'N/A',
    licenseNo: hp?.ProfessionalDetails?.licenseNumber || 'N/A',
    ptrNo: hp?.ProfessionalDetails?.ptrNumber || '',
    doctorAddress: '',
    createdDateTime: new Date().toLocaleString(),
  };

  return NextResponse.json(pdfData, { status: 200 });
});
