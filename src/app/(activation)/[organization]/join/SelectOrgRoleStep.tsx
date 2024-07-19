import { getUserOrganizationsAction, getOrganizationRolesAction } from "@actions/organization.action";
import { SelectOrgForm } from "./SelectOrgFom";

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
    getOrganizationRolesAction({ orgId })
  ]);
  const existingRoles = myOrgs.map(org => org.role);

  return (
    <SelectOrgForm orgId={orgId} orgRoles={orgRoles} existingRoles={existingRoles} isFirstStep={isFirstStep} isLastStep={isLastStep} nextStep={nextStep} />
  );
};
