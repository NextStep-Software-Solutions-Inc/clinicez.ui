import { getClinicSettingAction } from "@actions/organizations/clinic-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function ConsultationLayout({ children, params: {organization} }: Readonly<{ children: React.ReactNode, params: {organization: string} }>) {
  const [orgSetting] = await Promise.all([
    await getClinicSettingAction(organization) // Fetch organization settings
  ])
  
  if(!orgSetting.data?.enableConsultation) {
    permanentRedirect("/unauthorized")
  }
  return (
    <>{children}</>
  );
}
