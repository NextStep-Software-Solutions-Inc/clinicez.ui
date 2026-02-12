import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { SelectOrgForm } from "./SelectOrgFom";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
  interface SelectOrgRoleStepProps {
  orgUid: string;
  userId: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
}
export default async function SelectOrgRoleStep ({ orgUid, userId, isFirstStep, isLastStep, nextStep }: SelectOrgRoleStepProps) {
  const [myOrgs, orgRoles] = await Promise.all([
    getOrgMembersAction({ userId }),
    getOrganizationRolesAction({ orgUid })
  ]);
  const existingRoles = myOrgs.data?.data.map(org => org.role) ?? [];

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
