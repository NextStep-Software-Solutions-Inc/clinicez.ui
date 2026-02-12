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
      <TabsList className="grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="imaging">Imaging Procedures</TabsTrigger>
        <TabsTrigger value="laboratory">Laboratory Procedures</TabsTrigger>
        <TabsTrigger value="heart-station">Heart Station</TabsTrigger>
      </TabsList>

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
