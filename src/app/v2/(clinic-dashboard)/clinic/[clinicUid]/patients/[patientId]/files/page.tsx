import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCachedSession } from "@/actions/session.action";
import {
  getPatientFilesForClinicAction,
} from "@/actions/patient/patient-files.action";
import { getFileTypesAction } from "@/actions/file-type.action";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";
import { ClinicPatientFilesClient } from "@/components/v2/patients/ClinicPatientFilesClient";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Patient Files",
  description: "View and manage patient health documents",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clinicUid: string; patientId: string }>;
}

export default async function ClinicPatientFilesPage({ params }: Props) {
  const { clinicUid, patientId } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) return <UnauthorizedWarning />;

  const numericPatientId = parseInt(patientId, 10);
  if (isNaN(numericPatientId)) notFound();

  const [patient, foldersResult, fileTypesResult, currentUser, clinic] = await Promise.all([
    getClinicPatientProfileAction({ clinicUid, patientId: numericPatientId }),
    getPatientFilesForClinicAction({ patientId: numericPatientId, clinicUid }),
    getFileTypesAction(),
    prisma.user.findUnique({
      where: { userId: session.user.sub, isActive: true },
      select: { id: true },
    }),
    prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    }),
  ]);

  if (!patient) notFound();
  if (!currentUser) return <UnauthorizedWarning />;
  if (!clinic) notFound();

  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500 animate-pulse text-xs font-semibold">Loading patient files...</div>}>
      <ClinicPatientFilesClient
        clinicUid={clinicUid}
        clinicId={clinic.id}
        patientId={numericPatientId}
        patientName={patient.fullName}
        patientPicture={patient.picture ?? null}
        patientAge={patient.age ?? null}
        patientGender={patient.gender ?? null}
        patientBloodType={patient.bloodType ?? null}
        patientCaseNumber={patient.caseNumber ?? null}
        initialFolders={foldersResult.data ?? []}
        fileTypes={fileTypesResult ?? []}
        currentUserId={currentUser.id}
      />
    </Suspense>
  );
}
