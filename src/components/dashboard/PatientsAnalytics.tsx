import { getPatientAnalyticsData, resolveOrgUidFromClinicUid } from "@actions/dashboard/analytics.action";
import { BloodTypeChart } from "@components/charts/BloodTypeChart";
import { CivilStatusChart } from "@components/charts/CivilStatusChart";
import { GenderChart } from "@components/charts/GenderChart";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isOrgMember, canViewOrgMembers, isOrgHealthcareProvider } from "@lib/org-utils";

export const PatientsAnalytics = async ({ orgUid }: { orgUid: string; }) => {
  const resolveOrgUid = await resolveOrgUidFromClinicUid(orgUid);
  if (!resolveOrgUid) {
    throw new Error("Organization UID could not be resolved from clinic UID.");
  }

  const [stats, member, canView, hp] = await Promise.all([
    getPatientAnalyticsData(resolveOrgUid),
    isOrgMember(),
    canViewOrgMembers(resolveOrgUid),
    isOrgHealthcareProvider(resolveOrgUid),
  ]);
  const { genderStats, bloodTypeStats, civilStatusStats } = stats;

  const genderChartData = genderStats.map(g => ({ 
    gender: g.gender ?? "UNKNOWN",
    count: g.gender ? g._count.gender : g._count._all,
    all: g._count._all,
    fill: `var(--color-${g.gender ?? "UNKNOWN"})`
  }));

  const bloodTypeChartData = bloodTypeStats.map(b => ({
    bloodType: b.bloodType ?? "UNKNOWN",
    count: b.bloodType ? b._count.bloodType : b._count._all,
    all: b._count._all,
    fill: `var(--color-${b.bloodType ?? "UNKNOWN"})`
  }));

  const civilStatusChartData = civilStatusStats.map(b => ({
    civilStatus: b.civilStatus ?? "UNKNOWN",
    count: b.civilStatus ? b._count.civilStatus : b._count._all,
    all: b._count._all,
    fill: `var(--color-${b.civilStatus ?? "UNKNOWN"})`
  }));
  
  
  return (
    <ConditionalRender condition={(member && hp) || canView}>
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
        <GenderChart chartData={genderChartData} />
        <BloodTypeChart chartData={bloodTypeChartData} />
        <CivilStatusChart chartData={civilStatusChartData} />
      </div>
    </ConditionalRender>
  );
};
