"use server";

import { PhilHealthYakapClient } from "@/components/v2/clinic/reports/philhealth/PhilHealthYakapClient";

interface PhilHealthPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function PhilHealthPage(props: PhilHealthPageProps) {
  const params = await props.params;
  const { clinicUid } = params;

  return <PhilHealthYakapClient clinicUid={clinicUid} />;
}
