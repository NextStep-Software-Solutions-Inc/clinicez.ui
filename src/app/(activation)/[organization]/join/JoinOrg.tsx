import { JoinOrgForm } from "./JoinOrgForm";
import { getOrganizationRolesAction, getUserOrganizationsAction } from "@actions/organization.action";

interface JoinOrgProps {
  orgId: string;
  userId: string;
}

export const JoinOrg = async ({ orgId, userId }: JoinOrgProps) => {
  const [myOrgs, orgRoles] = await Promise.all([
    getUserOrganizationsAction({ userId }),
    getOrganizationRolesAction({ orgId })
  ]);
  const existingRoles = myOrgs.map(org => org.role);

  return (
    <JoinOrgForm userId={userId} orgId={orgId} orgRoles={orgRoles} existingRoles={existingRoles} />
  );
};
