import { getClinicSettingAction } from "@actions/clinics/clinic-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function AppointmentLayout(
  props: Readonly<{ children: React.ReactNode, params: Promise<{clinicUid: string}> }>
) {
  const params = await props.params;

  const {
    clinicUid
  } = params;

  const {
    children
  } = props;

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
