import { Metadata } from "next";
import { ClinicPatientsClient } from "@/components/v2/patients/ClinicPatientsClient";

export const metadata: Metadata = {
  title: "Patients",
  description: "View and manage clinic patients",
};

interface PatientsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function PatientsPage(props: PatientsPageProps) {
  const { clinicUid } = await props.params;

  return <ClinicPatientsClient clinicUid={clinicUid} />;
}
