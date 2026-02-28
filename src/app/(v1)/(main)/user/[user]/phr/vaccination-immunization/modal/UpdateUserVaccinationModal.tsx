'use client';

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
import Suspend from "@components/Suspend";
import { UpdateVaccinationForm } from "../UpdateVaccinationForm";
import { UserVaccinationType } from "../Vaccinations";

export type VaccineType = Awaited<ReturnType<typeof getVaccinesAction>>[number];

interface UpdateUserVaccinationModalProps {
  vaccination: UserVaccinationType
}

export default function UpdateUserVaccinationModal({vaccination}:UpdateUserVaccinationModalProps) {
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="flex-grow">Edit</Button>
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Update Vaccination" 
        description="Update a vaccination record"
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning!</AlertTitle>
          <AlertDescription>
            Make sure to update the vaccination record correctly. Incorrect information may lead to confusion.
          </AlertDescription>
        </Alert>
        <Suspend>
          <UpdateUserVaccinationFormWrapper vaccination={vaccination}/>
        </Suspend>
      </CustomModalContent>
    </Dialog>
  );
}


export const UpdateUserVaccinationFormWrapper = async ({vaccination}: {vaccination: UserVaccinationType}) => {
  const vaccines = await getVaccinesAction()
  return (
    <UpdateVaccinationForm vaccines={vaccines} vaccination={vaccination} />
  )
}
