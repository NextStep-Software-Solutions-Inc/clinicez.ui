import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";

interface OrgSettingLayoutProps {
    children: React.ReactNode;
    params: {
        orgUid: string;
    }
}
export default async function OrgSettingLayout({children, params: {orgUid}}:OrgSettingLayoutProps) {
  const session = await getCachedSession();
  const myRoles = await getOrganizationRolesAction({
    userId: session?.user.sub,
    orgUid,
    status: "ACTIVE"
  })
  
  if(!myRoles.some(role => role.name.toLocaleLowerCase() === "admin")) redirect("/unauthorized");
  return (
    <>{children}</>
  );
}
