import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";

interface OrgSettingLayoutProps {
    children: React.ReactNode;
    params: {
        organization: string;
    }
}
export default async function OrgSettingLayout({children, params: {organization}}:OrgSettingLayoutProps) {
  const session = await getCachedSession();
  const myRoles = await getOrganizationRolesAction({
    userId: session?.user.sub,
    orgId: organization,
    status: "ACTIVE"
  })
  if(!myRoles.some(role => role.name.toLocaleLowerCase() === "admin")) redirect("/unauthorized");
  return (
    <>{children}</>
  );
}
