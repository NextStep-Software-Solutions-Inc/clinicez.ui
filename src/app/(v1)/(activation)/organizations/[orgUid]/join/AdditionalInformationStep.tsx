"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import EmployeeRecordForm from "./EmployeeRecordForm";
import ConditionalRender from "@components/utils/ConditionalRender";
import StudentRecordForm from "./StudentRecordForm";
import FileRequirementForm from "./FileRequirementForm";
import { atom, useAtomValue } from "jotai";
import Each from "@components/utils/Each";
import { joinOrgApplicationAtom } from "@state/join-org-application";
import {
  isFileUploadRequirement,
  isRequirementRequired,
  parseRequirementSettings,
} from "@/lib/requirement-types";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface OrganizationStepProps {
  orgUid: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
  prevStep?: () => void;
}

export const additionalInfoValidAtom = atom<Record<string, boolean>>({
  employee_record: false,
  student_record: false,
})

function RequirementFormItem({
  optional,
  children,
}: {
  optional: boolean;
  children: ReactNode;
}) {
  if (!optional) return <>{children}</>;
  return (
    <div className="space-y-2">
      <Badge variant="secondary" className="text-xs">Optional</Badge>
      {children}
    </div>
  );
}

export default function AdditionalInformationStep({ orgUid, isLastStep, isFirstStep, nextStep, prevStep }: OrganizationStepProps) {

  const additionalInfoValidValue = useAtomValue(additionalInfoValidAtom)
  const orgApplication = useAtomValue(joinOrgApplicationAtom)
  const requirements = [... new Set(orgApplication.roleRequirements ?? [])];
  const requirementSettings = parseRequirementSettings(orgApplication.roleRequirementSettings);

  const isValid = requirements.every(requirement => {
    if (!isRequirementRequired(requirement, requirementSettings)) return true;
    return additionalInfoValidValue[requirement] ?? false;
  });

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
            const optional = !isRequirementRequired(requirement, requirementSettings);
            return (
              <>
                <ConditionalRender condition={requirement === "employee_record"}>
                  <RequirementFormItem optional={optional}>
                    <EmployeeRecordForm
                      orgUid={orgUid}
                      userId={orgApplication.userId ?? ""}
                    />
                  </RequirementFormItem>
                </ConditionalRender>
                <ConditionalRender condition={requirement === "student_record"}>
                  <RequirementFormItem optional={optional}>
                    <StudentRecordForm
                      orgUid={orgUid}
                      userId={orgApplication.userId ?? ""}
                    />
                  </RequirementFormItem>
                </ConditionalRender>
                <ConditionalRender condition={isFileUploadRequirement(requirement)}>
                  <RequirementFormItem optional={optional}>
                    <FileRequirementForm requirementType={requirement} orgUid={orgUid} />
                  </RequirementFormItem>
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
