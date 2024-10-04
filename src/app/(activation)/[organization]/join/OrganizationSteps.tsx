"use server";

import AdditionalInformationStep from "./AdditionalInformationStep";
import OrganizationApplication from "./OrganizationApplication";
import SelectOrgRoleStep from "./SelectOrgRoleStep";
import ConfirmationAndReviewStep from "./ConfirmationAndReviewStep";
interface OrganizationStepsProps {
  orgId: string;
  userId: string;
}

export default async function OrganizationSteps ({orgId, userId}:OrganizationStepsProps){
  return (
    <OrganizationApplication currentStep={1}>
      <SelectOrgRoleStep userId={userId} orgId={orgId} />
      <AdditionalInformationStep orgId={orgId}/>
      <ConfirmationAndReviewStep orgId={orgId} />
    </OrganizationApplication>
  )
};
