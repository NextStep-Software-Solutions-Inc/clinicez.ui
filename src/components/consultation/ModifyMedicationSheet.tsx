"use client";

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { useSearchParams } from "next/navigation";
import { Download, FileText, Pill, Trash } from "lucide-react";
import { useMedication, useMedicationDrugs, } from "@hooks/useMedication";
import Each from "@components/utils/Each";
import { Badge } from "@components/ui/badge";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { removeMedicationDrugAction } from "@actions/medications/medication-drug.action";
import AddMedicationDrugModal from "@components/prescription/modals/AddMedicationDrugModal";
import { createPrescriptionAction } from "@actions/medications/prescription.action";
import { useHP } from "@hooks/useHP";
import { useAtomValue } from "jotai";
import { sessionClinicAtom } from "@state/session-clinic";
import { usePermissions } from "@hooks/usePermission";
import { useUser } from "@auth0/nextjs-auth0/client";
import { PERMISSIONS } from "@lib/permissions";

interface ModifyMedicationSheetProps {
  readonly?: boolean;
}
export default function ModifyMedicationSheet({ readonly }: ModifyMedicationSheetProps ) {

  const {user} = useUser()
  const sessionClinicValue = useAtomValue(sessionClinicAtom)
  const searchParams = useSearchParams()
  const medicationId = Number(searchParams.get("modify-medication") ?? 0)

  const open = useMemo(() => !!medicationId, [medicationId])

  const {data: medication, mutate: mutateMedication} = useMedication(medicationId, sessionClinicValue?.clinicId ?? 0)
  const {data: medicationDrugs, mutate} = useMedicationDrugs(medicationId)
  const {data: myPermissions } = usePermissions({ userId: user?.sub ?? "", type: "ORGANIZATION" })

  const handleClose = (state: boolean) => {
    const searchParams = new URLSearchParams(window.location.search)
    if(!state) searchParams.delete("modify-medication")
    window.history.replaceState({}, "", `${window.location.pathname}?${searchParams}`)
  }

  const handleRemoveDrug = (medicationDrugId: number) => {
    toast.promise(removeMedicationDrugAction(medicationDrugId), {
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
    unit: string | null;
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
        unit: medicationDrug.unit,
        dosage: medicationDrug.dosage,
        quantity: medicationDrug.quantity,
        isGeneric: medicationDrug.isGeneric,
        notes: medicationDrug.notes,
        daysCount: medicationDrug.daysCount
      }
    })
  }, [medicationDrugs?.data])


  const handleCreatePrescription = () => {
    if(!medication?.data) {
      toast.error("Medication not found")
      return
    }
    toast.promise(createPrescriptionAction({
      clinicId: medication.data.clinicId,
      hpId: medication.data.hpId,
      medicationId: medication.data.id,
      name: medication.data.name,
    }), {
      loading: "Creating prescription...",
      success: res => {
        if(res.status) {
          mutateMedication()
        }
        return res.message
      },
      error: "Failed to create prescription"
    })
  }
  
 
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="space-y-4 min-w-[calc(100dvw-50%)] select-none" >
        <SheetHeader>
          <SheetTitle>{medication?.data?.name || `Medication #${medicationId}`}</SheetTitle>
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
                      <Badge variant="outline">{medicationDrug.quantity} {medicationDrug.unit}</Badge>
                      <Badge variant="outline">{medicationDrug.daysCount} Days</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground indent-6">Sig: {medicationDrug.notes}</p>
                  </div>
                  {
                    !readonly && myPermissions?.some(p => p.name === PERMISSIONS.CLINIC["REMOVE:CLINIC:MEDICATION_DRUG"].name) && (
                      <form action={()=>handleRemoveDrug(medicationDrug.id)}>
                        <ActionButton variant="outline" size="icon" className="">
                          <Trash className="w-4 h-4 text-destructive"/>
                        </ActionButton>
                      </form>
                    )
                  }
                </div>
              )}
            />
          </div>
          <div className="flex gap-2 items-center">
            {/* add permission check here */}
            {!readonly && myPermissions?.some(p => p.name === PERMISSIONS.CLINIC["ADD:CLINIC:MEDICATION_DRUG"].name) && (
              <AddMedicationDrugModal medicationId={medication?.data?.id!} onCreated={mutate} />
            ) }
            {
              !readonly && myPermissions?.some(p => p.name === PERMISSIONS.CLINIC["CREATE:CLINIC:PRESCRIPTION"].name) && medication?.data?._count.Prescriptions === 0 && ( // add permission check here
                <form action={handleCreatePrescription} className="w-full">
                  <ActionButton 
                    variant="outline" 
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Prescription
                  </ActionButton>
                </form>
              )
            }
          </div>
          <Separator/>
          <div className="space-y-2">
            {
              medication?.data?.Prescriptions?.map((prescription) => (
                <Prescription key={prescription.id} prescription={prescription} />
              ))
            }
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const Prescription = ({prescription}: {
  prescription: {id: number, hpId: number}
}) => {
  const {data: hp } = useHP(prescription.hpId)
  return (
    <Button key={prescription.id} variant="outline" className="w-full">
      <Download className="h-4 w-4 mr-2" />
      Download Prescription of {hp?.HPProfile?.title} {hp?.HPProfile?.name} {hp?.HPProfile?.suffix}&apos;s
    </Button>
  )
}