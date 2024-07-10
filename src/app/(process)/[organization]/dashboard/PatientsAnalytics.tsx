import { getPatientAnalyticsData } from "@actions/dashboard/analytics.action";
import { BloodTypeChart } from "@components/charts/BloodTypeChart";
import { CivilStatusChart } from "@components/charts/CivilStatusChart";
import { GenderChart } from "@components/charts/GenderChart";

export const PatientsAnalytics = async ({ orgId }: { orgId: string; }) => {
  const data = await getPatientAnalyticsData(orgId);
  const { genderStats, bloodTypeStats, civilStatusStats } = data;

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
    <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
      <GenderChart chartData={genderChartData} />
      <BloodTypeChart chartData={bloodTypeChartData} />
      <CivilStatusChart chartData={civilStatusChartData} />
    </div>
  );
};
