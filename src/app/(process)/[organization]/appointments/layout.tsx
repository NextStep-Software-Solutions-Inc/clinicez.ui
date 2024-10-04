import { getOrgSettingAction } from "@actions/organizations/org-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function AppointmentLayout({ children, params: {organization} }: Readonly<{ children: React.ReactNode, params: {organization: string} }>) {
  const [orgSetting] = await Promise.all([
    await getOrgSettingAction(organization) // Fetch organization settings
  ])
  
  if(!orgSetting.data?.enableAppointment) {
    permanentRedirect("/unauthorized")
  }
  return (
    <>{children}</>
  );
}
