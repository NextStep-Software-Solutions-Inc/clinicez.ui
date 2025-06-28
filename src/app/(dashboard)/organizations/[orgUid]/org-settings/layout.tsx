import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";

interface OrgSettingLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgUid: string;
  }>
}
export default async function OrgSettingLayout(props: OrgSettingLayoutProps) {
  const params = await props.params;

  const {
    orgUid
  } = params;

  const {
    children
  } = props;

  const session = await getCachedSession();
  const myRoles = await getOrgMembersAction({
    userId: session?.user.sub,
    orgUid,
    status: ["ACTIVE"]
  })

  if (!myRoles.data?.data?.some(role => role.OrganizationRole.name.toLocaleLowerCase() === "admin")) redirect("/unauthorized");
  return (
    <>{children}</>
  );
}
