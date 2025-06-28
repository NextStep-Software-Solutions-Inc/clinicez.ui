import React from "react";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ConsultationTable from "../../../../../../components/consultation/ConsultationTable";
import { AppRouterPageRouteOpts } from "@/types";

export const metadata: Metadata = {
  title: "Consultation Tickets",
  description: "Consultation Tickets within your organization.",
}

export default async function ConsultationsPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const clinicUid = String(params?.clinicUid)
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consultation Tickets</h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a list of your consultation records.
          </p>
        </div>
        <Separator />
        <ConsultationTable clinicUid={clinicUid}/>
      </div>
    </>
  );
}