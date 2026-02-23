import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrgClinicsAction } from "@/actions/organizations/org-clinics.action";
import { OrgClinicsClient } from "@/components/v2/org/clinics/OrgClinicsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clinics",
  description: "Manage clinics linked to this organization",
};

interface OrgClinicsPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgClinicsPage({ params }: OrgClinicsPageProps) {
  const { orgUid } = await params;

  const result = await getOrgClinicsAction(orgUid);

  if (!result.status || !result.data) {
    notFound();
  }

  return (
    <OrgClinicsClient
      clinics={result.data.clinics}
    />
  );
}
