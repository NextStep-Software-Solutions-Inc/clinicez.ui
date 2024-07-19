"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
import React from "react";
import EmployeeRecordForm from "./EmployeeRecordForm";
import ConditionalRender from "@components/utils/ConditionalRender";
import { OrganizationApplicationData } from "./OrganizationSteps";
import StudentRecordForm from "./StudentRecordForm";
import { Separator } from "@components/ui/separator";

interface OrganizationStepProps {
    orgId: string;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    nextStep?: () => void;
    prevStep?: () => void;
}

export default function AdditionalInformationStep({ orgId, isLastStep, isFirstStep, nextStep, prevStep }: OrganizationStepProps) {

  const [orgApplication] = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`);
  
  return (
    <div className="shadow-2xl p-10 rounded-sm">
      <ConditionalRender condition={orgApplication.roleRequirements?.includes("employee_record") ?? false}>
        <EmployeeRecordForm orgId={orgId}/>
        <Separator className="my-10"/>
        <StudentRecordForm orgId={orgId}/>
      </ConditionalRender>
      <div className="mt-5">
        <BackSubmitAndNext
          actions={{
            previous: prevStep,
            next: nextStep,
          }}
          disabled={{
            submit: !isLastStep,
            next: isLastStep,
            previous: isFirstStep
          }}
        />
      </div>
    </div>
  );
}
