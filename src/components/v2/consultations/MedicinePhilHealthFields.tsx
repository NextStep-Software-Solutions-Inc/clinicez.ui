"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Check } from "lucide-react";
import {
  upsertMedicinePhilHealthAction,
  getMedicinePhilHealthAction,
} from "@/actions/consultation/medicine-philhealth.action";

interface MedicinePhilHealthFieldsProps {
  medicineId: number;
  disabled?: boolean;
}

interface PhilHealthMedData {
  drugCode: string;
  genericCode: string;
  saltCode: string;
  strengthCode: string;
  formCode: string;
  unitCode: string;
  packageCode: string;
  route: string;
  otherMedicine: string;
  othMedDrugGrouping: string;
}

const emptyData: PhilHealthMedData = {
  drugCode: "",
  genericCode: "",
  saltCode: "",
  strengthCode: "",
  formCode: "",
  unitCode: "",
  packageCode: "",
  route: "",
  otherMedicine: "",
  othMedDrugGrouping: "",
};

/**
 * Inline PhilHealth medicine code fields that appear below
 * each medicine row when the consultation is PhilHealth Konsulta-enabled.
 */
export default function MedicinePhilHealthFields({
  medicineId,
  disabled = false,
}: MedicinePhilHealthFieldsProps) {
  const [data, setData] = useState<PhilHealthMedData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getMedicinePhilHealthAction(medicineId);
      if (!cancelled && result.data) {
        setData({
          drugCode: result.data.drugCode ?? "",
          genericCode: result.data.genericCode ?? "",
          saltCode: result.data.saltCode ?? "",
          strengthCode: result.data.strengthCode ?? "",
          formCode: result.data.formCode ?? "",
          unitCode: result.data.unitCode ?? "",
          packageCode: result.data.packageCode ?? "",
          route: result.data.route ?? "",
          otherMedicine: result.data.otherMedicine ?? "",
          othMedDrugGrouping: result.data.othMedDrugGrouping ?? "",
        });
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [medicineId]);

  const handleBlur = () => {
    startSaving(async () => {
      await upsertMedicinePhilHealthAction({
        medicineId,
        ...data,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const update = (field: keyof PhilHealthMedData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (!loaded) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading PhilHealth data...
      </div>
    );
  }

  return (
    <div className="rounded-md border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-2 mt-1 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-teal-700 dark:text-teal-400">
        <ShieldCheck className="h-3 w-3" />
        PhilHealth Drug Codes
        {saving && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        {saved && <Check className="h-3 w-3 text-emerald-500 ml-auto" />}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([
          ["drugCode", "Drug Code"],
          ["genericCode", "Generic Code"],
          ["saltCode", "Salt Code"],
          ["strengthCode", "Strength Code"],
          ["formCode", "Form Code"],
          ["unitCode", "Unit Code"],
          ["packageCode", "Package Code"],
          ["route", "Route"],
        ] as [keyof PhilHealthMedData, string][]).map(([field, label]) => (
          <div key={field} className="space-y-0.5">
            <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">
              {label}
            </Label>
            <Input
              value={data[field]}
              onChange={(e) => update(field, e.target.value)}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder={label}
              className="h-6 text-[10px] font-mono px-1.5"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Other Medicine
          </Label>
          <Input
            value={data.otherMedicine}
            onChange={(e) => update("otherMedicine", e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Generic name if no drug code"
            className="h-6 text-[10px] px-1.5"
          />
        </div>
        <div className="space-y-0.5">
          <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Drug Grouping
          </Label>
          <Input
            value={data.othMedDrugGrouping}
            onChange={(e) => update("othMedDrugGrouping", e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Drug group"
            className="h-6 text-[10px] px-1.5"
          />
        </div>
      </div>
    </div>
  );
}
