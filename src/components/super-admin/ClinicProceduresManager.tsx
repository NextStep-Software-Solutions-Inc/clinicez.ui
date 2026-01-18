"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicProceduresTable } from "@/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedures-table";
import { getAllMasterImagingProceduresAction, getAllMasterLaboratoryProceduresAction, getAllMasterHeartStationProceduresAction } from "@/actions/super-admin/diagnostics-procedures.action";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { ClinicProcedureForm } from "@/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedure-form";

interface ClinicProceduresManagerProps {
  clinicId: number;
}

export function ClinicProceduresManager({
  clinicId,
}: ClinicProceduresManagerProps) {
  const [procedureType, setProcedureType] = useState<
    "imaging" | "laboratory" | "heart_station"
  >("imaging");

  return (
    <Tabs value={procedureType} onValueChange={(value: any) =>
      setProcedureType(value)
    }>
      <TabsList className="grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="imaging">Imaging Procedures</TabsTrigger>
        <TabsTrigger value="laboratory">Laboratory Procedures</TabsTrigger>
        <TabsTrigger value="heart_station">Heart Station</TabsTrigger>
      </TabsList>

      <TabsContent value="imaging" className="space-y-4">
        <ClinicProceduresTableWrapper
          clinicId={clinicId}
          type="imaging"
        />
      </TabsContent>

      <TabsContent value="laboratory" className="space-y-4">
        <ClinicProceduresTableWrapper
          clinicId={clinicId}
          type="laboratory"
        />
      </TabsContent>

      <TabsContent value="heart_station" className="space-y-4">
        <ClinicProceduresTableWrapper
          clinicId={clinicId}
          type="heart_station"
        />
      </TabsContent>
    </Tabs>
  );
}

// Wrapper to handle the table with add button
function ClinicProceduresTableWrapper({
  clinicId,
  type,
}: {
  clinicId: number;
  type: "imaging" | "laboratory" | "heart_station";
}) {
  const [refetchKey, setRefetchKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Procedure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Clinic Procedure</DialogTitle>
            </DialogHeader>
            <ClinicProcedureForm
              clinicId={clinicId}
              type={type}
              onSuccess={() => {
                setRefetchKey((k) => k + 1);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <ClinicProceduresTable
        clinicId={clinicId}
        type={type}
        key={refetchKey}
      />
    </div>
  );
}
