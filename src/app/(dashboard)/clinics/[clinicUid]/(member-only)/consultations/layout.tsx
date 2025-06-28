import { getClinicSettingAction } from "@/actions/clinics/clinic-setting.action";
import { permanentRedirect } from "next/navigation";

export default async function ConsultationLayout(
  props: Readonly<{ children: React.ReactNode, params: {clinicUid: string} }>
) {
  const params = await props.params;

  const {
    clinicUid
  } = params;

  const {
    children
  } = props;

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
