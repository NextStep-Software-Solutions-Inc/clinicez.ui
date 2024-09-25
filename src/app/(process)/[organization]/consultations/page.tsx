import React from "react";
import { Separator } from "@components/ui/separator";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Metadata } from "next";
import ConsultationTable from "./components/ConsultationTable";

export const metadata: Metadata = {
  title: "Consultation Records",
  description: "Consultation Records within your organization.",
}

async function ConsultationsPage({params}: AppRouterPageRouteOpts) {
  const orgUid = params?.organization as string
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consultation Records</h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a list of your consultation records.
          </p>
        </div>
        <Separator />
        <ConsultationTable orgUid={orgUid}/>
      </div>
    </>
  );
}

export default withPageAuthRequired(ConsultationsPage, {
  returnTo: ({params, searchParams}) => {
    const organization = params?.organization
    const newSearchParams = new URLSearchParams(searchParams as Record<string, string>)
    return `/${organization}/consultations?${newSearchParams.toString()}`
  }
});