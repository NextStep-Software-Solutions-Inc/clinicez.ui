import { getClinicSettingAction } from "@/actions/clinics/clinic-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function ConsultationLayout({ children, params: {clinicUid} }: Readonly<{ children: React.ReactNode, params: {clinicUid: string} }>) {
  const [clinicSetting] = await Promise.all([
    await getClinicSettingAction(clinicUid) // Fetch clinicUid settings
  ])
  
  if(!clinicSetting.data?.enableConsultation) {
    permanentRedirect("/unauthorized")
  }
  return (
    <>{children}</>
  );
}
