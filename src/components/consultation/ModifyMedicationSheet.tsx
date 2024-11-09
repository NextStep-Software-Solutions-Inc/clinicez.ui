"use client";

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { useSearchParams } from "next/navigation";
import { Pill, Trash, X } from "lucide-react";
import { useMedication, useMedicationDrugs, useMedications } from "@hooks/useMedication";
import Each from "@components/utils/Each";
import { Badge } from "@components/ui/badge";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { deleteMedicationDrugAction } from "@actions/medications/medication-drug.action";
import AddMedicationDrugModal from "@components/prescription/modals/AddMedicationDrugModal";

interface ModifyMedicationSheetProps {
  consultation: {
    id: number;
    patientId: number;
  }
}
export default function ModifyMedicationSheet({consultation}: ModifyMedicationSheetProps ) {

  const searchParams = useSearchParams()
  const open = useMemo(() => !!searchParams.get("modify-medication"), [searchParams])
  const {data: medication} = useMedication(Number(searchParams.get("modify-medication") ?? 0))
  const {data: medicationDrugs, mutate} = useMedicationDrugs(Number(searchParams.get("modify-medication") ?? 0))

  const handleClose = (state: boolean) => {
    const searchParams = new URLSearchParams(window.location.search)
    if(!state) searchParams.delete("modify-medication")
    window.history.replaceState({}, "", `${window.location.pathname}?${searchParams}`)
  }

  const handleRemoveDrug = (medicationDrugId: number) => {
    toast.promise(deleteMedicationDrugAction(medicationDrugId), {
      loading: "Removing medication drug...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to remove medication drug"
    })
  }

  type MedicationDrug = {
    id: number;
    brandName: string;
    genericName: string;
    dosage: string;
    quantity: number;
    isGeneric: boolean;
    notes: string | null;
    daysCount: number | null;
  }

  const mappedMedicationDrugs: MedicationDrug[] = useMemo(() => {
    return (medicationDrugs?.data ?? []).map((medicationDrug) => {
      return {
        id: medicationDrug.id,
        brandName: medicationDrug.Drug.brandName,
        genericName: medicationDrug.Drug.genericName,
        dosage: medicationDrug.dosage,
        quantity: medicationDrug.quantity,
        isGeneric: medicationDrug.isGeneric,
        notes: medicationDrug.notes,
        daysCount: medicationDrug.daysCount
      }
    })
  }, [medicationDrugs?.data])
  
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="space-y-4 min-w-[calc(100dvw-50%)] select-none" >
        <SheetHeader>
          <SheetTitle>{medication?.data?.name || `Medication #${medication?.data?.id}`}</SheetTitle>
          <SheetDescription>
            Modify the medication details.
          </SheetDescription>
        </SheetHeader>
        <Separator/>
        <div className="space-y-5">
          <div className="space-y-2">
            <Each
              of={mappedMedicationDrugs}
              fallback={<p className="text-center text-muted-foreground">No medication drugs added.</p>}
              render={(medicationDrug) => (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill size={16} />
                      <span className="text-sm">{medicationDrug.genericName} {!medicationDrug.isGeneric ? `- ${medicationDrug.brandName}` : ""}</span>
                      <Badge variant="outline">{medicationDrug.dosage}</Badge>
                      <Badge variant="outline">{medicationDrug.quantity} Tablet</Badge>
                      <Badge variant="outline">{medicationDrug.daysCount} Days</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground indent-6">{medicationDrug.notes}</p>
                  </div>
                  <ActionButton variant="outline" size="icon" className="" onClick={()=>handleRemoveDrug(medicationDrug.id)}>
                    <Trash className="w-4 h-4 text-destructive"/>
                  </ActionButton>
                </div>
              )}
            />
          </div>
          <AddMedicationDrugModal medicationId={medication?.data?.id!} onCreated={mutate} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
