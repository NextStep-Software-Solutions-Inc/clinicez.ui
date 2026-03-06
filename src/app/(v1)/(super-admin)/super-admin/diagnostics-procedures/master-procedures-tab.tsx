"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterImagingProceduresTable } from "./master-imaging-procedures-table";
import { MasterLaboratoryProceduresTable } from "./master-laboratory-procedures-table";
import { MasterHeartStationProceduresTable } from "./master-heart-station-procedures-table";
import { MasterICD10CodesTable } from "./master-icd10-codes-table";

export function MasterProceduresTab() {
  const [activeTab, setActiveTab] = useState("imaging");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-3xl sm:grid-cols-4">
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
          <TabsTrigger value="heart-station">Heart Station</TabsTrigger>
          <TabsTrigger value="icd10">ICD-10 Codes</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="imaging" className="space-y-4">
        <MasterImagingProceduresTable />
      </TabsContent>
      <TabsContent value="laboratory" className="space-y-4">
        <MasterLaboratoryProceduresTable />
      </TabsContent>
      <TabsContent value="heart-station" className="space-y-4">
        <MasterHeartStationProceduresTable />
      </TabsContent>
      <TabsContent value="icd10" className="space-y-4">
        <MasterICD10CodesTable />
      </TabsContent>
    </Tabs>
  );
}
