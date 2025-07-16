import { getHealthAnalyticsData, resolveOrgUidFromClinicUid } from "@actions/dashboard/analytics.action";
import DisabilityChart from "@components/charts/DisabilityChart";
import IllnessChart from "@components/charts/IllnessChart";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isOrgMember, isOrgAdmin, isOrgHealthcareProvider } from "@lib/org-utils";

interface PatientHealthAnalyticsProps {
  orgUid: string;
}

export const PatientHealthAnalytics = async ({ orgUid }: PatientHealthAnalyticsProps) => {
  const resolveOrgUid = await resolveOrgUidFromClinicUid(orgUid);
  if (!resolveOrgUid) {
    throw new Error("Organization UID could not be resolved from clinic UID.");
  }

  const [stats, member, orgAdmin, hp] = await Promise.all([
    getHealthAnalyticsData(resolveOrgUid),
    isOrgMember(),
    isOrgAdmin(resolveOrgUid),
    isOrgHealthcareProvider(resolveOrgUid)
  ]);

  const illnesses: { illness: string; count: number; }[] = stats.illness.map(item => ({
    illness: item.name,
    count: item._count.UserHealthConditions
  }));

  const disabilities: { disability: string; count: number; }[] = stats.disability.map(item => ({
    disability: item.name,
    count: item._count.UserDisabilities
  }));

  return (
    <ConditionalRender condition={(member && hp) || orgAdmin}>
      <div className="grid gap-2 grid-cols-1 xl:grid-cols-2">
        <DisabilityChart chartData={disabilities} />
        <IllnessChart chartData={illnesses} />
      </div>
    </ConditionalRender>
  );
};
