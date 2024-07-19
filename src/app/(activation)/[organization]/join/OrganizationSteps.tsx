"use server";

import AdditionalInformationStep from "./AdditionalInformationStep";
import OrganizationApplication from "./OrganizationApplication";
import SelectOrgRoleStep from "./SelectOrgRoleStep";
import ConfirmationAndReviewStep from "./ConfirmationAndReviewStep";
import { EmployeeRecordType } from "./EmployeeRecordForm";

interface OrganizationStepsProps {
  orgId: string;
  userId: string;
}

export type OrganizationApplicationData = Partial<{
  orgId: string
  roleId: number
  userId: string
  roleRequirements: string[]
  employee_record: EmployeeRecordType
  student_record: EmployeeRecordType
}>
export default async function OrganizationSteps ({orgId, userId}:OrganizationStepsProps){
  return (
    <OrganizationApplication currentStep={1}>
      <SelectOrgRoleStep userId={userId} orgId={orgId} />
      <AdditionalInformationStep orgId={orgId}/>
      <ConfirmationAndReviewStep orgId={orgId} />
    </OrganizationApplication>
  )
};
