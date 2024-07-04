import React from "react";
import {
  Dialog,
  DialogTrigger,
} from "@components/ui/dialog"
import { Button } from "@components/ui/button";
import CustomModalContent from "@components/CustomModalContent";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { getVaccinesAction } from "@actions/vaccine.action";
import { AddUserVaccinationForm } from "../AddVaccinationForm";
import Suspend from "@components/Suspend";

interface AddUserVaccinationModalProps {}
export type VaccineType = Awaited<ReturnType<typeof getVaccinesAction>>[number];

export default async function AddUserVaccinationModal({}:AddUserVaccinationModalProps) {
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Vaccination</Button>
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Add Vaccination" 
        description="Add a new vaccination record."
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning!</AlertTitle>
          <AlertDescription>
            Ensure that you have the correct information before adding a new vaccination record.
          </AlertDescription>
        </Alert>
        <Suspend>
          <AddUserVaccinationFormWrapper/>
        </Suspend>
      </CustomModalContent>
    </Dialog>
  );
}


export const AddUserVaccinationFormWrapper = async () => {
  const vaccines = await getVaccinesAction()
  return (
    <AddUserVaccinationForm vaccines={vaccines}/>
  )
}
