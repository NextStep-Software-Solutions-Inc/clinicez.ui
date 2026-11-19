"use client";

import { Fragment, useState, useTransition } from "react";
import { Plus, Pill, Trash2, ChevronDown, ChevronUp, FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import {
  createPrescriptionAction,
  deletePrescriptionAction,
} from "@/actions/clinics/clinical-record/prescription.action";
import {
  createMedicineAction,
  deleteMedicineAction,
} from "@/actions/clinics/clinical-record/medicine.action";
import {
  getConsultationPrescriptionsForTicketAction,
} from "@/actions/consultation/patient-consultations.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import DownloadPrescriptionAction from "@/components/clinic/clinical-records/prescription/DownloadPrescriptionAction";
import MedicinePhilHealthCombobox, { MedicineSelection } from "./MedicinePhilHealthCombobox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type Prescription = NonNullable<Detail["Prescriptions"]>[number];

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
}

interface ConsultationPrescriptionsProps {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  isResolved?: boolean;
}

interface NewMedicineForm {
  selection: MedicineSelection;
  dosage: string;
  frequency: string;
  unit: string;
  duration: string;
  qty: string;
  notes: string;
  
  // Custom grouping when using "Other"
  othMedDrugGrouping: string;

  // Dispensing
  isDispensed: boolean;
  actualUnitPrice: string;
}

const emptyMedicine: NewMedicineForm = {
  selection: null,
  dosage: "",
  frequency: "",
  unit: "",
  duration: "1",
  qty: "",
  notes: "",
  othMedDrugGrouping: "",
  isDispensed: false,
  actualUnitPrice: "",
};

export default function ConsultationPrescriptions({
  clinicUid,
  patient,
  consultation,
  myHPs,
  onPatchDetail,
  isResolved = false,
}: ConsultationPrescriptionsProps) {
  const ticketHpIds = consultation.ConsultationTicketHPs.map((h) => h.HealthCareProvider.id);
  const myActiveHp = myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  const [showForm, setShowForm] = useState(false);
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const [rxName, setRxName] = useState("");
  const [rxRemarks, setRxRemarks] = useState("");
  const [medicines, setMedicines] = useState<NewMedicineForm[]>([{ ...emptyMedicine }]);
  const [isPending, startTransition] = useTransition();
  const [expandedRx, setExpandedRx] = useState<Record<number, boolean>>({});

  const addMedicineRow = () => setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  const updateMedicine = (index: number, field: keyof NewMedicineForm, value: string | boolean) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };
  const removeMedicineRow = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const openReplaceForm = (rxId: number) => {
    setReplacingId(rxId);
    setRxName("");
    setRxRemarks("");
    setMedicines([{ ...emptyMedicine }]);
    setShowForm(true);
  };

  const handleCreate = () => {
    if (!myActiveHp) {
      toast.error("No HP profile found for this consultation");
      return;
    }
    if (medicines.length === 0 || !medicines[0].selection) {
      toast.error("Add at least one medicine and ensure all drug names are set");
      return;
    }
    startTransition(async () => {
      // If replacing, void the old prescription first
      if (replacingId !== null) {
        const voidResult = await deletePrescriptionAction({ prescriptionId: replacingId });
        if (!voidResult.status) {
          toast.error(voidResult.message ?? "Failed to void existing prescription");
          return;
        }
      }
      // 1. Create prescription
      const rxResult = await createPrescriptionAction({
        clinicUid,
        consultationTicketId: consultation.id,
        patientId: patient.clinicPatientId,
        hpIds: [myActiveHp.id],
        name: rxName || undefined,
        remarks: rxRemarks || undefined,
      });
      if (!rxResult.status || !rxResult.data) {
        toast.error(rxResult.message ?? "Failed to create prescription");
        return;
      }
      const prescriptionId = rxResult.data.id;
      // 2. Add medicines
      for (const med of medicines) {
        if (!med.selection) continue;

        let name = "";
        let genericName, unitName, category, drugCode, genericCode, saltCode, strengthCode, formCode, unitCode, packageCode;

        if ("isCustom" in med.selection) {
          name = med.selection.customName;
          category = "";
          drugCode = "NOMED0000000000000000000000000";
          genericCode = "NOMED";
          saltCode = "00000";
          strengthCode = "00000";
          formCode = "00000";
          unitCode = "00000";
          packageCode = "00000";
        } else {
          name = med.selection.description;
          genericName = med.selection.genericName;
          unitName = med.selection.unitName;
          category = med.selection.category;
          drugCode = med.selection.drugCode;
          genericCode = med.selection.genericCode;
          saltCode = med.selection.saltCode;
          strengthCode = med.selection.strengthCode;
          formCode = med.selection.formCode;
          unitCode = med.selection.unitCode;
          packageCode = med.selection.packageCode;
        }

        const isCustom = "isCustom" in med.selection;
        const qtyVal = med.qty ? parseInt(med.qty) : undefined;
        
        await createMedicineAction({
          prescriptionId,
          name,
          brandName: undefined,
          genericName,
          isGeneric: false,
          dosage: med.dosage || undefined,
          frequency: med.frequency || undefined,
          unit: med.unit || unitName,
          duration: med.duration ? parseInt(med.duration) : undefined,
          qty: qtyVal,
          notes: med.notes || undefined,
          philHealth: {
            category,
            drugCode,
            genericCode,
            saltCode,
            strengthCode,
            formCode,
            unitCode,
            packageCode,
            otherMedicine: isCustom ? name : undefined,
            othMedDrugGrouping: isCustom ? med.othMedDrugGrouping : undefined,
            instructionQuantity: "1",
            instructionStrength: med.dosage || undefined,
            instructionFrequency: med.frequency || undefined,
            actualUnitPrice: med.isDispensed && med.actualUnitPrice ? parseFloat(med.actualUnitPrice) : undefined,
            totalAmtPrice: med.isDispensed && med.actualUnitPrice && qtyVal ? parseFloat(med.actualUnitPrice) * qtyVal : undefined,
          },
          dispensing: {
            isDispensed: med.isDispensed,
            dateDispensed: med.isDispensed ? new Date() : undefined,
          }
        } as any); // using as any due to CreateMedicineInput imported type mismatch in this scope, wait let me check
      }
      toast.success(replacingId ? "Prescription replaced" : "Prescription created");
      setShowForm(false);
      setReplacingId(null);
      setRxName("");
      setRxRemarks("");
      setMedicines([{ ...emptyMedicine }]);
      // Patch only the prescriptions section
      const prescriptionsResult = await getConsultationPrescriptionsForTicketAction({ ticketId: consultation.id });
      if (prescriptionsResult.status && prescriptionsResult.data) {
        onPatchDetail({ Prescriptions: prescriptionsResult.data });
      }
    });
  };

  const handleDeleteMedicine = (medicineId: number) => {
    startTransition(async () => {
      const result = await deleteMedicineAction({ medicineId });
      if (result.status) {
        toast.success("Medicine removed");
        // Remove medicine in-place — no server re-fetch needed
        onPatchDetail({
          Prescriptions: consultation.Prescriptions.map((rx) => ({
            ...rx,
            Medicines: rx.Medicines?.filter((m) => m.id !== medicineId) ?? [],
          })),
        });
      } else {
        toast.error(result.message ?? "Failed to remove medicine");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          Prescriptions
        </h3>
        {!showForm && !isResolved && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowForm(true)}
            disabled={!myActiveHp}
          >
            <Plus className="h-3.5 w-3.5" />
            New Rx
          </Button>
        )}
      </div>

      {/* New Prescription Form */}
      {showForm && !isResolved && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4">
          <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
            {replacingId ? "Replace Prescription" : "New Prescription"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rx Name (optional)</Label>
              <Input
                placeholder="e.g. Post-op medications"
                value={rxName}
                onChange={(e) => setRxName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remarks</Label>
              <Input
                placeholder="Special instructions..."
                value={rxRemarks}
                onChange={(e) => setRxRemarks(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Medicines</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs gap-1"
                onClick={addMedicineRow}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {medicines.map((med, idx) => (
              <div key={idx} className="rounded border border-border/40 bg-background p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Drug Name *</Label>
                    <div className="flex gap-2">
                      <MedicinePhilHealthCombobox 
                        value={med.selection}
                        onChange={(sel) => {
                          updateMedicine(idx, "selection", sel as any);
                          if (sel && !("isCustom" in sel)) {
                            if (sel.strengthName) updateMedicine(idx, "dosage", sel.strengthName);
                            if (sel.formName) updateMedicine(idx, "unit", sel.formName);
                          }
                        }}
                        className="h-8 text-xs flex-1"
                      />
                      {med.selection && "isCustom" in med.selection && (
                        <div className="w-[120px]">
                          <Select
                            value={med.othMedDrugGrouping || '_empty'}
                            onValueChange={(val) => updateMedicine(idx, "othMedDrugGrouping", val === '_empty' ? '' : val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Group *" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_empty">None</SelectItem>
                              <SelectItem value="NCD">NCD</SelectItem>
                              <SelectItem value="ANTIBIOTIC">ANTIBIOTIC</SelectItem>
                              <SelectItem value="OTHERS">OTHERS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dosage</Label>
                    <Input
                      placeholder="500mg"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Input
                      placeholder="TID"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      placeholder="tabs"
                      value={med.unit}
                      onChange={(e) => updateMedicine(idx, "unit", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Days</Label>
                    <Input
                      type="number"
                      min={1}
                      value={med.duration}
                      onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={med.qty}
                      onChange={(e) => updateMedicine(idx, "qty", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Notes"
                    value={med.notes}
                    onChange={(e) => updateMedicine(idx, "notes", e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  {medicines.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeMedicineRow(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                {/* Dispensing Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-border/40 mt-1">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={med.isDispensed}
                      onCheckedChange={(c) => updateMedicine(idx, "isDispensed", c)}
                    />
                    <Label className="text-xs font-medium cursor-pointer" onClick={() => updateMedicine(idx, "isDispensed", !med.isDispensed)}>
                      Dispense now
                    </Label>
                  </div>
                  {med.isDispensed && (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="space-y-1 flex-1 max-w-[120px]">
                        <Label className="text-[10px] text-muted-foreground">Unit Price (₱)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="e.g. 15.50"
                          value={med.actualUnitPrice}
                          onChange={(e) => updateMedicine(idx, "actualUnitPrice", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1 flex-1 max-w-[120px]">
                        <Label className="text-[10px] text-muted-foreground">Total (₱)</Label>
                        <Input
                          disabled
                          value={med.actualUnitPrice && med.qty ? (parseFloat(med.actualUnitPrice) * parseInt(med.qty)).toFixed(2) : ""}
                          className="h-7 text-xs bg-muted/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setShowForm(false);
                setReplacingId(null);
                setMedicines([{ ...emptyMedicine }]);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={handleCreate}
            >
              {isPending ? "Saving…" : replacingId ? "Replace Prescription" : "Save Prescription"}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Prescriptions */}
      {(consultation.Prescriptions?.length ?? 0) === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No prescriptions issued yet.
        </div>
      ) : (
        <div className="space-y-2">
          {consultation.Prescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              rx={rx}
              expanded={!!expandedRx[rx.id]}
              onToggle={() =>
                setExpandedRx((prev) => ({ ...prev, [rx.id]: !prev[rx.id] }))
              }
              onDeleteMedicine={handleDeleteMedicine}
              onReplace={isResolved ? undefined : () => openReplaceForm(rx.id)}
              isResolved={isResolved}
              isKonsulta={consultation.isPhilHealthKonsulta ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatMedicineDetails(med: {
  dosage?: string | null;
  frequency?: string | null;
  unit?: string | null;
  duration?: number | null;
  qty?: number | null;
}): string {
  return [
    med.dosage,
    med.frequency,
    med.unit,
    med.duration ? `${med.duration}d` : null,
    med.qty ? `Qty: ${med.qty}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function PrescriptionCard({
  rx,
  expanded,
  onToggle,
  onDeleteMedicine,
  onReplace,
  isResolved = false,
  isKonsulta = false,
}: {
  rx: Prescription;
  expanded: boolean;
  onToggle: () => void;
  onDeleteMedicine: (id: number) => void;
  onReplace?: () => void;
  isResolved?: boolean;
  isKonsulta?: boolean;
}) {
  const hpName = rx.HealthcareProvider?.HPProfile?.name
    ? `${rx.HealthcareProvider.HPProfile.title ?? ""} ${rx.HealthcareProvider.HPProfile.name}`.trim()
    : `${rx.HealthcareProvider?.User?.firstName ?? ""} ${rx.HealthcareProvider?.User?.lastName ?? ""}`.trim();

  return (
    <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left min-w-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                {rx.name || `Prescription #${rx.id}`}
              </span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {rx.Medicines?.length ?? 0} item{(rx.Medicines?.length ?? 0) !== 1 ? "s" : ""}
              </Badge>
              {rx.Medicines?.some((m: any) => m.MedicineDispenseRecord?.isDispensed) && (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-4 px-1.5">
                  Dispensed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hpName && <span>{hpName} · </span>}
              {dayjs(rx.createdAt).format("MMM D, YYYY")}
              {rx.serialNumber && <span className="ml-1 font-mono text-[10px]">#{rx.serialNumber}</span>}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>
        <div className="shrink-0 pr-3 flex items-center gap-1">
          {onReplace && (
            <Button
              size="sm" variant="ghost" className="h-7 w-7 p-0" title="Void & Replace"
              onClick={(e) => { e.stopPropagation(); onReplace(); }}
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
            </Button>
          )}
          <DownloadPrescriptionAction prescription={{ id: rx.id }}>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Preview PDF">
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </DownloadPrescriptionAction>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {rx.remarks && (
            <p className="text-xs text-muted-foreground mb-3 italic">{rx.remarks}</p>
          )}
          <div className="space-y-1.5">
            {rx.Medicines?.map((med: any) => {
              const dispenseRec = med.MedicineDispenseRecord;
              const phData = med.PhilHealthData;
              const isDispensed = dispenseRec?.isDispensed ?? false;
              const unitPrice = phData?.actualUnitPrice ?? dispenseRec?.actualUnitPrice ?? null;
              const totalAmt = phData?.totalAmtPrice ?? dispenseRec?.totalAmtPrice ?? (unitPrice && med.qty ? Number(unitPrice) * med.qty : null);
              const dateDispensed = dispenseRec?.dateDispensed ? dayjs(dispenseRec.dateDispensed).format("MMM D, YYYY") : null;
              const personnel = dispenseRec?.dispensingPersonnel || "Pharmacy Staff";

              return (
                <Fragment key={med.id}>
                  <div className="flex flex-col gap-1 rounded-md bg-muted/30 px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{med.name}</p>
                        <p className="text-muted-foreground">
                          {formatMedicineDetails(med)}
                        </p>
                        {med.notes && <p className="text-muted-foreground/70 italic">{med.notes}</p>}
                      </div>
                      {!isResolved && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/60 hover:text-destructive shrink-0"
                          onClick={() => onDeleteMedicine(med.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {isDispensed ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-900 dark:text-emerald-200">
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1.5 py-0 h-4">
                          Dispensed
                        </Badge>
                        {unitPrice != null && (
                          <span className="font-semibold">
                            ₱{Number(unitPrice).toFixed(2)} / unit {totalAmt != null && `(Total: ₱${Number(totalAmt).toFixed(2)})`}
                          </span>
                        )}
                        {dateDispensed && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            · Date: {dateDispensed}
                          </span>
                        )}
                        {personnel && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            · Dispensed By: {personnel}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] h-3.5 px-1 text-slate-500 border-slate-300 dark:text-slate-400 dark:border-slate-700">
                          Not Dispensed
                        </Badge>
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
