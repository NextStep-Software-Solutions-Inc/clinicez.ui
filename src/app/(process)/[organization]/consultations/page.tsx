import './data/seed'
import React from "react";
import { Separator } from "@components/ui/separator";
import Suspend from "@components/Suspend";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns"
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Metadata } from "next";
import { getConsultations } from '@actions/consultations.action';

export const metadata: Metadata = {
  title: "Consultations",
  description: "Consultations of an organization.",
}

async function ConsultationsPage() {
  const consultations = await getConsultations()
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consultations</h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a list of your consultations.
          </p>
        </div>
        <Separator />
        <Suspend>
          <DataTable data={consultations} columns={columns} />
        </Suspend>
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