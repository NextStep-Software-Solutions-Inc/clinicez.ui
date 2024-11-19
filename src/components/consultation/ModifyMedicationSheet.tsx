"use client";

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import { Download, FileText, Pill, Trash } from "lucide-react";
import { useMedication, useMedicationDrugs, } from "@hooks/useMedication";
import Each from "@components/utils/Each";
import { Badge } from "@components/ui/badge";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { removeMedicationDrugAction } from "@actions/medications/medication-drug.action";
import AddMedicationDrugModal from "@components/prescription/modals/AddMedicationDrugModal";
import { createPrescriptionAction, getPrescriptionAction } from "@actions/medications/prescription.action";
import { useHP } from "@hooks/useHP";
import { usePermissions } from "@hooks/usePermission";
import { useUser } from "@auth0/nextjs-auth0/client";
import { PERMISSIONS } from "@lib/permissions";
import { promiseWrapper } from "@/lib/with-error-handling";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";

interface ModifyMedicationSheetProps {
  readonly?: boolean;
}
export default function ModifyMedicationSheet({ readonly }: ModifyMedicationSheetProps ) {

  const {user} = useUser()
  const {clinicUid} = useParams<{clinicUid: string}>()
  const searchParams = useSearchParams()
  const medicationId = Number(searchParams.get("modify-medication") ?? 0)

  const open = useMemo(() => !!medicationId, [medicationId])

  const {data: medication, mutate: mutateMedication} = useMedication(medicationId, clinicUid)
  
  const {data: medicationDrugs, mutate} = useMedicationDrugs(medicationId)
  const {data: myPermissions } = usePermissions({ userId: user?.sub ?? "", type: "CLINIC" })

  const handleClose = (state: boolean) => {
    const searchParams = new URLSearchParams(window.location.search)
    if(!state) searchParams.delete("modify-medication")
    window.history.replaceState({}, "", `${window.location.pathname}?${searchParams}`)
  }

  const handleRemoveDrug = (medicationDrugId: number) => {
    toast.promise(promiseWrapper(removeMedicationDrugAction)(medicationDrugId), {
      loading: "Removing medication drug...",
      success: res => {
        mutate()
        return res.message
      },
      error: error => error
    })
  }

  type MedicationDrug = {
    id: number;
    brandName: string;
    genericName: string;
    unit: string | null;
    dosage: string;
    frequency: string;
    isGeneric: boolean;
    notes: string | null;
    duration: number;
  }

  const mappedMedicationDrugs: MedicationDrug[] = useMemo(() => {
    return (medicationDrugs?.data ?? []).map((medicationDrug) => {
      return {
        id: medicationDrug.id,
        brandName: medicationDrug.Drug.brandName,
        genericName: medicationDrug.Drug.genericName,
        unit: medicationDrug.unit,
        dosage: medicationDrug.dosage,
        frequency: medicationDrug.frequency,
        isGeneric: medicationDrug.isGeneric,
        notes: medicationDrug.notes,
        duration: medicationDrug.duration
      }
    })
  }, [medicationDrugs?.data])


  const handleCreatePrescription = () => {
    if(!medication?.data) {
      toast.error("Medication not found")
      return
    }
    toast.promise(promiseWrapper(createPrescriptionAction)({
      clinicUid,
      hpId: medication.data.hpId,
      medicationId: medication.data.id,
      name: medication.data.name,
    }), {
      loading: "Creating prescription...",
      success: res => {
        mutateMedication()
        return res.message
      },
      error: error => error
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
                      <span className="text-sm">{medicationDrug.genericName} {!medicationDrug.isGeneric ? `- ${medicationDrug.brandName}` : ""} </span>
                      <Badge variant="outline">{medicationDrug.unit}</Badge>
                      <Badge variant="outline">{medicationDrug.dosage}</Badge>
                      <Badge variant="outline">{medicationDrug.frequency}</Badge>
                      <Badge variant="outline">For {medicationDrug.duration} day(s)</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground indent-6">Sig: {medicationDrug.notes}</p>
                  </div>
                  {
                    !readonly && myPermissions?.some(p => p.name === PERMISSIONS.CLINIC["REMOVE:CLINIC:MEDICATION_DRUG"].name) && !medication?.data?.completedAt && (
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
            {!readonly && myPermissions?.some(p => p.name === PERMISSIONS.CLINIC["ADD:CLINIC:MEDICATION_DRUG"].name) && medication?.data?.id && !medication.data.completedAt && (
              <AddMedicationDrugModal medicationId={medication?.data?.id} onCreated={mutate} />
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

interface PrescriptionProps {
  prescription: {
    id: number;
    name: string | null;
    HealthcareProvider: {
        HPProfile: {
            name: string;
            suffix: string | null;
            title: string;
        } | null;
    }
  }
}
export const Prescription = ({prescription}: PrescriptionProps) => {

  const handleDownloadPrescription = async () => {
    toast.promise(promiseWrapper(getPrescriptionAction)(prescription.id), {
      loading: "Downloading prescription...",
      success: res => {
        handlePrintHtmlToPDF(res.data?.DocumentTemplate.htmlContent);
        return res.message
      },
      error: error => error
    })
  }

  return (
    <form action={handleDownloadPrescription}>
      <ActionButton variant="outline" className="w-full">
        <Download className="h-4 w-4 mr-2" />
      Download Prescription of {prescription.HealthcareProvider?.HPProfile?.title} {prescription.HealthcareProvider?.HPProfile?.name} {prescription.HealthcareProvider?.HPProfile?.suffix}&apos;s
      </ActionButton>
    </form>
  )
}