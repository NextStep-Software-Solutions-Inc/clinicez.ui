"use client";

import { addClinicPatientAction } from "@/actions/clinics/clinic-patient.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useClinicPatients } from "@/hooks/useClinicPatient";
import { promiseWrapper } from "@/lib/with-error-handling";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

export function JoinAsPatientDialog() {

  const searchParams = useSearchParams();
  const { clinicUid } = useParams<{clinicUid: string}>();
  const {user} = useUser()
  const open = useMemo(() => searchParams.has("join-as-patient"), [searchParams]);


  const handleClose = (state: boolean) => {
    if(!state) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("join-as-patient");
      window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    }
  }

  const handleContinue = () => {

    if(!user?.sub) {
      toast.error("User id not found")
      return;
    }
    const searchParams = new URLSearchParams(window.location.search);

    toast.promise(promiseWrapper(addClinicPatientAction)({
      clinicUid,
      userId: user?.sub
    }), {
      loading: "Loading...",
      success: res => {
        searchParams.delete("join-as-patient");
        searchParams.set("book-appointment", "true");
        window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
        return res.message
      },
      error:error => error
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You are about to book appointment.</AlertDialogTitle>
          <AlertDialogDescription>
            By clicking continue, you will agree to the terms and conditions of the clinic and proceed to book an appointment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
