"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import React from "react";
import EmployeeRecordForm from "./EmployeeRecordForm";
import ConditionalRender from "@components/utils/ConditionalRender";
import StudentRecordForm from "./StudentRecordForm";
import { atom, useAtomValue } from "jotai";
import Each from "@components/utils/Each";
import { joinOrgApplicationAtom } from "@state/join-org-application";

interface OrganizationStepProps {
  orgUid: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
  prevStep?: () => void;
}

export const additionalInfoValidAtom = atom({
  employee_record: false,
  student_record: false,
})

export default function AdditionalInformationStep({ orgUid, isLastStep, isFirstStep, nextStep, prevStep }: OrganizationStepProps) {

  const additionalInfoValidValue = useAtomValue(additionalInfoValidAtom)
  const orgApplication = useAtomValue(joinOrgApplicationAtom)
  const requirements = [... new Set(orgApplication.roleRequirements ?? [])];
  const isValid = requirements.every(requirement => additionalInfoValidValue[requirement as keyof typeof additionalInfoValidValue])

  return (
    <div className="shadow-2xl p-10 rounded-sm">
      <h2 className="my-5 text-lg font-semibold">Additional Information</h2>
      <div className="space-y-10">
        <Each
          of={requirements}
          fallback={(
            <div>
              No additional information required. Proceed to the next step.
            </div>
          )}
          render={(requirement) => {
            return (
              <>
                <ConditionalRender condition={requirement === "employee_record"}>
                  <EmployeeRecordForm
                    orgUid={orgUid}
                    userId={orgApplication.userId ?? ""}
                  />
                </ConditionalRender>
                <ConditionalRender condition={requirement === "student_record"}>
                  <StudentRecordForm
                    orgUid={orgUid}
                    userId={orgApplication.userId ?? ""}
                  />
                </ConditionalRender>
              </>
            )
          }}
        />

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
