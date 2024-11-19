"use server";

import AdditionalInformationStep from "./AdditionalInformationStep";
import OrganizationApplication from "./OrganizationApplication";
import SelectOrgRoleStep from "./SelectOrgRoleStep";
import ConfirmationAndReviewStep from "./ConfirmationAndReviewStep";
interface OrganizationStepsProps {
  orgUid: string;
  userId: string;
}

export default async function OrganizationSteps ({orgUid, userId}:OrganizationStepsProps){
  return (
    <OrganizationApplication currentStep={1}>
      <SelectOrgRoleStep userId={userId} orgUid={orgUid} />
      <AdditionalInformationStep orgUid={orgUid}/>
      <ConfirmationAndReviewStep orgUid={orgUid} />
    </OrganizationApplication>
  )
};
