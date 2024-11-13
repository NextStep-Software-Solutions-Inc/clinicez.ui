import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { getUserOrganizationsAction } from "@actions/users/user-organization.action";
import { SelectOrgForm } from "./SelectOrgFom";
  interface SelectOrgRoleStepProps {
  orgUid: string;
  userId: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
}
export default async function SelectOrgRoleStep ({ orgUid, userId, isFirstStep, isLastStep, nextStep }: SelectOrgRoleStepProps) {
  const [myOrgs, orgRoles] = await Promise.all([
    getUserOrganizationsAction({ userId }),
    getOrganizationRolesAction({ orgUid })
  ]);
  const existingRoles = myOrgs.data.map(org => org.role);

  return (
    <SelectOrgForm 
      userId={userId} 
      orgUid={orgUid} 
      orgRoles={orgRoles} 
      existingRoles={existingRoles} 
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      nextStep={nextStep}
    />
  );
};
