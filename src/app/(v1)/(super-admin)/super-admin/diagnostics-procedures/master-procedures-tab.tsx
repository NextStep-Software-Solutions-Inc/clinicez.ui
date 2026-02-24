"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterImagingProceduresTable } from "./master-imaging-procedures-table";
import { MasterLaboratoryProceduresTable } from "./master-laboratory-procedures-table";
import { MasterHeartStationProceduresTable } from "./master-heart-station-procedures-table";

export function MasterProceduresTab() {
  const [activeTab, setActiveTab] = useState("imaging");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-3">
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
          <TabsTrigger value="heart-station">Heart Station</TabsTrigger>
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
    </Tabs>
  );
}
