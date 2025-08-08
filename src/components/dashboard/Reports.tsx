import { isOrgAdmin, isOrgMember } from "@/lib/org-utils";
import ConditionalRender from "../utils/ConditionalRender";
import { isClinicHealthcareProvider } from "@/lib/clinic-utils";
import { ReportsFilters } from "../clinic/dashboard/reports/ReportsFilters";
import Suspend from "../Suspend";

export const Reports = async ({ clinicUid }: { clinicUid: string }) => {
  const [member, orgAdmin, hp] = await Promise.all([
    isOrgMember(),
    isOrgAdmin(),
    isClinicHealthcareProvider(clinicUid)
  ])

  return (
    <ConditionalRender condition={(member && hp) || orgAdmin}>
      <div className="space-y-6">
        <Suspend>
          <ReportsFilters clinicUid={clinicUid} />
        </Suspend>
      </div>
    </ConditionalRender>
  );
}