import React from "react";
import { Separator } from "@components/ui/separator";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Metadata } from "next";
import ConsultationTable from "../../../../../components/consultation/ConsultationTable";

export const metadata: Metadata = {
  title: "Consultation Tickets",
  description: "Consultation Tickets within your organization.",
}

async function ConsultationsPage({params}: AppRouterPageRouteOpts) {
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

export default withPageAuthRequired(ConsultationsPage, {
  returnTo: ({params, searchParams}) => {
    const clinicUid = String(params?.clinicUid)
    const newSearchParams = new URLSearchParams(searchParams as Record<string, string>)
    return `/clinics/${clinicUid}/consultations?${newSearchParams.toString()}`
  }
});