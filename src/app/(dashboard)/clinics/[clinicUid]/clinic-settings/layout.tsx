import { getClinicRolesAction } from "@/actions/clinics/clinic-role.action";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";

interface OrgSettingLayoutProps {
    children: React.ReactNode;
    params: {
        clinicUid: string;
    }
}
export default async function OrgSettingLayout({children, params: {clinicUid}}:OrgSettingLayoutProps) {

  const session = await getCachedSession();
  const myRoles = await getClinicRolesAction({
    userId: session?.user.sub,
    clinicUid,
    status: "ACTIVE"
  })

  if(!myRoles.some(role =>  ["admin", "owner"].includes(role.name.toLocaleLowerCase()))) redirect("/unauthorized");
  return (
    <>{children}</>
  );
}
