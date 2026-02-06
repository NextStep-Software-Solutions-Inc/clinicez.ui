import { canViewOrgMembers, isOrgMember } from "@/lib/org-utils";
import ConditionalRender from "../utils/ConditionalRender";
import { isClinicHealthcareProvider } from "@/lib/clinic-utils";
import { ReportsFilters } from "../clinic/dashboard/reports/ReportsFilters";
import { BulkEKASDownload } from "../clinic/dashboard/reports/BulkEKASDownload";
import Suspend from "../Suspend";

export const Reports = async ({ clinicUid }: { clinicUid: string }) => {
  const [member, canView, hp] = await Promise.all([
    isOrgMember(),
    canViewOrgMembers(),
    isClinicHealthcareProvider(clinicUid)
  ])

  return (
    <ConditionalRender condition={(member && hp) || canView}>
      <div className="space-y-6">
        <Suspend>
          <ReportsFilters clinicUid={clinicUid} />
        </Suspend>
        <BulkEKASDownload clinicUid={clinicUid} />
      </div>
    </ConditionalRender>
  );
}