import type { Metadata } from "next";
import { getCachedSession } from "@/actions/session.action";
import {
  getPatientFoldersAction,
  getPatientClinicsAction,
} from "@/actions/patient/patient-files.action";
import { getFileTypesAction } from "@/actions/file-type.action";
import { PatientFilesClient } from "@/components/v2/patient-dashboard/PatientFilesClient";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";

export const metadata: Metadata = {
  title: "My Files",
  description: "Manage and organize your health records and documents",
};

export const dynamic = "force-dynamic";

export default async function PatientFilesPage() {
  const session = await getCachedSession();
  if (!session?.user?.sub) return <UnauthorizedWarning />;

  const [foldersResult, clinicsResult, fileTypesResult] = await Promise.all([
    getPatientFoldersAction(),
    getPatientClinicsAction(),
    getFileTypesAction(),
  ]);

  return (
    <PatientFilesClient
      initialFolders={foldersResult.data ?? []}
      clinics={(clinicsResult.data ?? []).map((c) => ({
        ...c,
        logo: c.logo ?? null,
      }))}
      fileTypes={fileTypesResult ?? []}
    />
  );
}
