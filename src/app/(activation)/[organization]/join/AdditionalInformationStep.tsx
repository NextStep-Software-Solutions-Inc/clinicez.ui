"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
import React from "react";
import EmployeeRecordForm from "./EmployeeRecordForm";
import ConditionalRender from "@components/utils/ConditionalRender";
import { OrganizationApplicationData } from "./OrganizationSteps";
import StudentRecordForm from "./StudentRecordForm";
import { atom, useAtomValue } from "jotai";

interface OrganizationStepProps {
  orgId: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
  prevStep?: () => void;
}

export const additionalInfoValidAtom = atom({
  employee_record: false,
  student_record: false,
})

export default function AdditionalInformationStep({ orgId, isLastStep, isFirstStep, nextStep, prevStep }: OrganizationStepProps) {

  const additionalInfoValidValue = useAtomValue(additionalInfoValidAtom)
  const [orgApplication] = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`);
  const requirements = orgApplication.roleRequirements ?? [];
  const isValid = requirements.every(requirement => additionalInfoValidValue[requirement as keyof typeof additionalInfoValidValue])

  return (
    <div className="shadow-2xl p-10 rounded-sm">
      <h2 className="my-5 text-lg font-semibold">Additional Information</h2>
      <div className="space-y-10">
        <ConditionalRender condition={orgApplication.roleRequirements?.includes("employee_record") ?? false}>
          <EmployeeRecordForm orgId={orgId}/>
        </ConditionalRender>
        <ConditionalRender condition={orgApplication.roleRequirements?.includes("student_record") ?? false}>
          <StudentRecordForm orgId={orgId}/>
        </ConditionalRender>
      </div>
      <div className="mt-5">
        <BackSubmitAndNext
          actions={{
            previous: prevStep,
            next: nextStep,
          }}
          disabled={{
            submit: !isLastStep,
            next: isLastStep || !isValid,
            previous: isFirstStep
          }}
        />
      </div>
    </div>
  );
}
