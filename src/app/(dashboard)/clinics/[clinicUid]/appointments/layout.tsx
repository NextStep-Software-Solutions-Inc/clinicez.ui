import { getClinicSettingAction } from "@actions/clinics/clinic-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function AppointmentLayout({ children, params: {clinicUid} }: Readonly<{ children: React.ReactNode, params: {clinicUid: string} }>) {
  const [clinicSetting] = await Promise.all([
    await getClinicSettingAction(clinicUid) // Fetch clinic settings
  ])
  
  if(!clinicSetting.data?.enableAppointment) {
    permanentRedirect("/unauthorized")
  }
  return (
    <>{children}</>
  );
}
