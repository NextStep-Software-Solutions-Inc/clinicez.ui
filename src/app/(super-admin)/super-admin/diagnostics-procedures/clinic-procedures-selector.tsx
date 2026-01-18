"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getAllClinicsForSelectionAction } from "@/actions/super-admin/diagnostics-procedures.action";
import { ClinicProceduresTable } from "./clinic-procedures-table";

interface ClinicProceduresSelectorProps {
  clinicId?: number;
  type?: "imaging" | "laboratory" | "heart_station";
  isEmbedded?: boolean;
  defaultType?: "imaging" | "laboratory" | "heart_station";
}

export function ClinicProceduresSelector({
  clinicId: propClinicId,
  type: propType,
  isEmbedded = false,
  defaultType = "imaging",
}: ClinicProceduresSelectorProps) {
  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    propClinicId ? propClinicId.toString() : ""
  );
  const [procedureType, setProcedureType] = useState<
    "imaging" | "laboratory" | "heart_station"
  >(propType || defaultType);

  const { data: clinics } = useQuery({
    queryKey: ["clinics-for-selection"],
    queryFn: () => getAllClinicsForSelectionAction(),
    enabled: !isEmbedded, // Don't fetch if embedded with provided clinicId
  });

  const effectiveClinicId = propClinicId || (selectedClinicId ? parseInt(selectedClinicId) : null);
  const effectiveType = propType || procedureType;

  return (
    <div className="space-y-4">
      {!isEmbedded && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clinic-select">Select Clinic</Label>
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger id="clinic-select">
                <SelectValue placeholder="Choose a clinic..." />
              </SelectTrigger>
              <SelectContent>
                {clinics?.data?.map((clinic: any) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div>
          <Label htmlFor="type-select">Procedure Type</Label>
          <Select value={procedureType} onValueChange={(value: any) =>
            setProcedureType(value)
          }>
            <SelectTrigger id="type-select">
              <SelectValue placeholder="Choose procedure type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imaging">Imaging Procedures</SelectItem>
              <SelectItem value="laboratory">Laboratory Procedures</SelectItem>
              <SelectItem value="heart_station">Heart Station</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>
      )}

      {effectiveClinicId && (
        <ClinicProceduresTable
          clinicId={effectiveClinicId}
          type={effectiveType}
        />
      )}
    </div>
  );
}
