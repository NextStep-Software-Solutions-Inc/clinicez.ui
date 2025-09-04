"use client";

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Pill } from "lucide-react";
import CreateMedicationModal from "@components/prescription/modals/CreateMedicationModal";
import { useMedications } from "@hooks/useMedication";
import Each from "@components/utils/Each";
import dayjs from "dayjs";
import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { toast } from "sonner";
import { setMedicationCompletedAction } from "@actions/medications/medication.action";
import { useHPs } from "@hooks/useHP";
import { useUser } from "@clerk/nextjs";
import { useAtomValue } from "jotai";
import { sessionClinicAtom } from "@state/session-clinic";

interface MedicationsSheetProps {
  readonly?: boolean;
  consultation: {
    id: number;
    patientId: number;
  }
}
export default function MedicationsSheet({ consultation, readonly = true }: MedicationsSheetProps) {

  const { user } = useUser()
  const { clinicUid } = useParams<{ clinicUid: string }>()
  const searchParams = useSearchParams()
  const open = useMemo(() => searchParams.get("show-medications") === "true", [searchParams])
  const { data: medications, mutate } = useMedications({ consultationTicketId: consultation.id, clinicUid })
  const { data: myHps } = useHPs({ userId: user?.id ?? "" })

  const handleClose = (state: boolean) => {
    const searchParams = new URLSearchParams(window.location.search)
    if (state) searchParams.set("show-medications", "true")
    else searchParams.delete("show-medications")
    window.history.replaceState({}, "", `${window.location.pathname}?${searchParams}`)
  }

  const handleModifyMedication = (medication: number) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("modify-medication", medication.toString())
    searchParams.delete("show-medications")
    window.history.replaceState({}, "", `${window.location.pathname}?${searchParams}`)
  }

  const handleCompleteMedication = (medicationId: number) => {
    toast.promise(setMedicationCompletedAction(medicationId), {
      loading: "Completing medication...",
      success: res => {
        if (res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to complete medication"
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          Medications
          <Pill className="h-4 w-4 ml-2" />
        </Button>
      </SheetTrigger>
      <SheetContent className="space-y-4 min-w-[calc(100dvw-70%)] select-none" >
        <SheetHeader>
          <SheetTitle>Medications</SheetTitle>
          <SheetDescription>
            Medications prescribed to the patient in this consultation.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="space-y-5">
          {!readonly && <CreateMedicationModal consultation={consultation} onCreated={mutate} />}
          <div className="space-y-2">
            <Each
              of={medications?.data ?? []}
              render={(medication) => {
                return (
                  <div
                    onClick={() => handleModifyMedication(medication.id)}
                    className={cn("border rounded p-2 cursor-pointer hover:bg-slate-50", {
                      "border-primary bg-primary/5": medication.completedAt
                    })}>

                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 items-center flex-wrap">
                        <h5 className="font-medium">{medication.name || `Medication #${medication.id}`}</h5>
                        <Badge variant="destructive">Medication Drugs: {medication._count.MedicationDrugs}</Badge>
                        {medication.completedAt && <Badge variant="default">Completed</Badge>}
                      </div>
                      {
                        !medication.completedAt && myHps?.some(hp => hp.id === medication.hpId) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={e => {
                                  e.stopPropagation()
                                  handleCompleteMedication(medication.id)
                                }} variant="outline" size="sm" className=""><Check className="w-4 h-4" /></Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark as Completed</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      }
                    </div>
                    <p className="text-muted-foreground text-xs">{dayjs(medication.createdAt).format('lll')}</p>
                  </div>
                )
              }}
            />
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
