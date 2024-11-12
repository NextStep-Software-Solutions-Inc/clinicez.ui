"use client";

import { ConsultationTableOptions, DataTable } from "./data-table";
import { columns } from "./columns"
import { useState } from "react";
import { useConsultations } from "@hooks/useConsultation";
import PageLoading from "@components/PageLoading";


interface ConsultationTableProps {
  clinicUid: string
}

export default function ConsultationTable({ clinicUid }: ConsultationTableProps) {
  const [showArchived, setShowArchived] = useState(false)
  const {data: consultations, isLoading} = useConsultations({
    clinicUid,
    showArchived
  })
  const handleOptionsChange = (options: ConsultationTableOptions) => {
    setShowArchived(options.showArchived === true) 
  }
  if(isLoading) return <PageLoading label="Loading Consultation Tickets" />
  return (
    <>
      <DataTable 
        data={consultations?.data ?? []} 
        columns={columns}
        options={{showArchived}}
        onOptionsChange={handleOptionsChange}
      />
    </>
  );
}
