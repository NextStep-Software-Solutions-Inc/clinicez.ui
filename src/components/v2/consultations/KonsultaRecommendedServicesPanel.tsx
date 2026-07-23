"use client";

import React, { useEffect, useState } from "react";
import { getKonsultaRecommendedService, updateKonsultaDiagnosticOptionsAction } from "@/actions/consultation/konsulta-recommended-services.action";
import { getDiagnosticProcedures } from "@/actions/clinics/clinical-record/diagnostic-procedures.action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface KonsultaRecommendedServicesPanelProps {
  consultationTicketId: number;
  patientAgeMonths: number;
  patientGender: string;
  initialOptions?: { philhealthDiagnosticId: string; status: 'RQ' | 'RF' | 'XX' }[];
  onUpdate?: () => void;
}

export default function KonsultaRecommendedServicesPanel({
  consultationTicketId,
  patientAgeMonths,
  patientGender,
  initialOptions = [],
  onUpdate,
}: KonsultaRecommendedServicesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [procedures, setProcedures] = useState<{ philhealthDiagnosticId: string | null; name: string }[]>([]);
  
  const [selections, setSelections] = useState<Record<string, 'RQ' | 'RF' | 'XX'>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [serviceRes, procRes] = await Promise.all([
          getKonsultaRecommendedService(patientAgeMonths, patientGender as any),
          getDiagnosticProcedures(),
        ]);

        if (serviceRes) {
          setRecommendedIds(serviceRes.philhealthDiagnosticIds as string[] || []);
          setDescription(serviceRes.consultationDescription || "");
        }

        if (procRes && procRes.data) {
          setProcedures(procRes.data);
        }

        // Map initial options
        const initialSelections: Record<string, 'RQ' | 'RF' | 'XX'> = {};
        initialOptions.forEach((opt) => {
          initialSelections[opt.philhealthDiagnosticId] = opt.status;
        });
        setSelections(initialSelections);

      } catch (error) {
        console.error(error);
        toast.error("Failed to load recommended services.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [patientAgeMonths, patientGender, initialOptions]);

  const handleSelectionChange = (id: string, value: 'RQ' | 'RF' | 'XX') => {
    setSelections(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const optionsArray = Object.entries(selections).map(([optId, status]) => ({
        philhealthDiagnosticId: optId,
        status,
      }));

      const res = await updateKonsultaDiagnosticOptionsAction(consultationTicketId, optionsArray);
      if (res && res.success) {
        toast.success("Recommended services updated successfully.");
        if (onUpdate) onUpdate();
      } else {
        toast.error(res?.error || "Failed to update services.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (recommendedIds.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-500">
        No specific diagnostics recommended for this patient's age and gender based on PhilHealth Annex B rules.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {recommendedIds
          .map((id) => {
            const proc = procedures.find((p) => p.philhealthDiagnosticId === id);
            return { id, name: proc ? proc.name : `Diagnostic ID: ${id}` };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ id, name }) => {
          const currentValue = selections[id] || 'XX'; // default to XX

          return (
            <div key={id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {name}
              </Label>
              <RadioGroup 
                className="flex items-center gap-6"
                value={currentValue}
                onValueChange={(val: 'RQ' | 'RF' | 'XX') => handleSelectionChange(id, val)}
                disabled={saving}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RQ" id={`rq-${id}`} />
                  <Label htmlFor={`rq-${id}`} className="cursor-pointer text-xs font-normal text-zinc-600 dark:text-zinc-400">Requested (RQ)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RF" id={`rf-${id}`} />
                  <Label htmlFor={`rf-${id}`} className="cursor-pointer text-xs font-normal text-zinc-600 dark:text-zinc-400">Refused (RF)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="XX" id={`xx-${id}`} />
                  <Label htmlFor={`xx-${id}`} className="cursor-pointer text-xs font-normal text-zinc-600 dark:text-zinc-400">Not Applicable (XX)</Label>
                </div>
              </RadioGroup>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Options"
          )}
        </Button>
      </div>
    </div>
  );
}
