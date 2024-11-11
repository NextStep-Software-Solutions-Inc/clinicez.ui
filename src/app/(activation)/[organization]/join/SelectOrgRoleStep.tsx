import { getClinicRolesAction } from "@actions/organizations/organization-role.action";
import { getUserOrganizationsAction } from "@actions/users/user-organization.action";
import { SelectOrgForm } from "./SelectOrgFom";
import HydrateAtoms from "@components/utils/HydrateAtoms";
  interface SelectOrgRoleStepProps {
  orgId: string;
  userId: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
}
export default async function SelectOrgRoleStep ({ orgId, userId, isFirstStep, isLastStep, nextStep }: SelectOrgRoleStepProps) {
  const [myOrgs, orgRoles] = await Promise.all([
    getUserOrganizationsAction({ userId }),
    getClinicRolesAction({ orgId })
  ]);
  const existingRoles = myOrgs.data.map(org => org.role);

  return (
    <SelectOrgForm 
      userId={userId} 
      orgId={orgId} 
      orgRoles={orgRoles} 
      existingRoles={existingRoles} 
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      nextStep={nextStep}
    />
  );
};
