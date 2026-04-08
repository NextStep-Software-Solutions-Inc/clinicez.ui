"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import EmployeeRecordForm from "./EmployeeRecordForm";
import ConditionalRender from "@components/utils/ConditionalRender";
import StudentRecordForm from "./StudentRecordForm";
import FileRequirementForm from "./FileRequirementForm";
import { atom, useAtomValue } from "jotai";
import Each from "@components/utils/Each";
import { joinOrgApplicationAtom } from "@state/join-org-application";
import { isFileUploadRequirement } from "@/lib/requirement-types";
import { Badge } from "@/components/ui/badge";

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

export default function AdditionalInformationStep({ orgUid, isLastStep, isFirstStep, nextStep, prevStep }: OrganizationStepProps) {

  const additionalInfoValidValue = useAtomValue(additionalInfoValidAtom)
  const orgApplication = useAtomValue(joinOrgApplicationAtom)
  const requirements = [... new Set(orgApplication.roleRequirements ?? [])];
  const requirementSettings = orgApplication.roleRequirementSettings ?? {};

  const isRequirementRequired = (req: string): boolean => {
    const setting = requirementSettings[req];
    if (setting === undefined) return true;
    return setting.isRequired;
  };

  const isValid = requirements.every(requirement => {
    if (!isRequirementRequired(requirement)) return true;
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
            const optional = !isRequirementRequired(requirement);
            return (
              <>
                <ConditionalRender condition={requirement === "employee_record"}>
                  <div className="space-y-2">
                    {optional && (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                    <EmployeeRecordForm
                      orgUid={orgUid}
                      userId={orgApplication.userId ?? ""}
                    />
                  </div>
                </ConditionalRender>
                <ConditionalRender condition={requirement === "student_record"}>
                  <div className="space-y-2">
                    {optional && (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                    <StudentRecordForm
                      orgUid={orgUid}
                      userId={orgApplication.userId ?? ""}
                    />
                  </div>
                </ConditionalRender>
                <ConditionalRender condition={isFileUploadRequirement(requirement)}>
                  <div className="space-y-2">
                    {optional && (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                    <FileRequirementForm requirementType={requirement} orgUid={orgUid} />
                  </div>
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
