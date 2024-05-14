import React from "react";
import { promises as fs } from "fs"
import { Separator } from "@components/ui/separator";
import Suspend from "@components/Suspend";
import { DataTable } from "./components/data-table";
import { z } from "zod";
import path from "path";
import { consultationRecordSchema } from "./data/schema"
import { columns } from "./components/columns"
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
// Simulate a database read for tasks.
async function getTasks() {
  const data = await fs.readFile(
    path.join(process.cwd(), "src/app/(process)/[organization]/consultations/data/tasks.json")
  )

  const tasks = JSON.parse(data.toString())

  return z.array(consultationRecordSchema).parse(tasks)
}


async function ConsultationsPage() {
  
  const tasks = await getTasks()
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
          <DataTable data={tasks} columns={columns} />
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