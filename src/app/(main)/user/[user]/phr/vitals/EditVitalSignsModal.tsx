"use client";

import CustomModalContent from "@components/CustomModalContent"
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Dialog, DialogTrigger } from "@components/ui/dialog"
import { AlertCircle } from "lucide-react"
import EditVitalSignsForm from "./EditVitalSignsForm"
import { Button } from "@components/ui/button"
import { VitalSignsType } from "./RecentVitalSigns"

export default function EditVitalSignsModal({vitalSign}: {vitalSign: VitalSignsType[number]}) {
    
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex-grow sm:flex-grow-0">Update</Button>
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[625px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Update Vital Signs" 
        description="Update your vital signs and anthropometric measurements."
      >
        <Alert className="my-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Caution</AlertTitle>
          <AlertDescription>
              Ensure that you have the correct information before updating your vital signs.
          </AlertDescription>
        </Alert>
        <EditVitalSignsForm vitalSign={vitalSign} />
      </CustomModalContent>
    </Dialog>
  )
}