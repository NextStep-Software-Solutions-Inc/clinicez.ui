import type { Metadata } from "next";
import { PhilHealthReportTab } from "@/components/v2/clinic/reports/PhilHealthReportTab";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PhilHealth",
  description: "PhilHealth Konsulta patient management and batch reporting",
};

interface PhilHealthPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicPhilHealthPage({ params }: PhilHealthPageProps) {
  const { clinicUid } = await params;

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">PhilHealth Konsulta</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage enrolled patients, generate PCB reports, and submit to PhilHealth.
        </p>
      </div>
      <PhilHealthReportTab clinicUid={clinicUid} />
    </div>
  );
}
