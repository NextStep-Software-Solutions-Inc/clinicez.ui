"use server";

import AdditionalInformationStep from "./AdditionalInformationStep";
import OrganizationApplication from "./OrganizationApplication";
import SelectOrgRoleStep from "./SelectOrgRoleStep";
import ConfirmationAndReviewStep from "./ConfirmationAndReviewStep";
import { getOrganizationAction } from "@actions/organizations/organization.action";

interface OrganizationStepsProps {
  orgUid: string;
  userId: string;
}

export default async function OrganizationSteps({ orgUid, userId }: OrganizationStepsProps) {
  const org = await getOrganizationAction(orgUid).catch(() => null);
  return (
    <OrganizationApplication currentStep={1}>
      <SelectOrgRoleStep userId={userId} orgUid={orgUid} />
      <AdditionalInformationStep orgUid={orgUid} />
      <ConfirmationAndReviewStep
        orgUid={orgUid}
        termsAndConditionsUrl={org?.termsAndConditionsUrl}
        privacyPolicyUrl={org?.privacyPolicyUrl}
      />
    </OrganizationApplication>
  );
}
