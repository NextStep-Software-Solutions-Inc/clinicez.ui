import { getPatientAnalyticsData } from "@actions/dashboard/analytics.action";
import { BloodTypeChart } from "@components/charts/BloodTypeChart";
import { CivilStatusChart } from "@components/charts/CivilStatusChart";
import { GenderChart } from "@components/charts/GenderChart";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isMember, isOrgAdmin } from "@lib/protect-org";

export const PatientsAnalytics = async ({ orgId }: { orgId: string; }) => {
  const [stats, member, orgAdmin] = await Promise.all([
    getPatientAnalyticsData(orgId),
    isMember(),
    isOrgAdmin()
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
    <ConditionalRender condition={member && orgAdmin}>
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
        <GenderChart chartData={genderChartData} />
        <BloodTypeChart chartData={bloodTypeChartData} />
        <CivilStatusChart chartData={civilStatusChartData} />
      </div>
    </ConditionalRender>
  );
};
