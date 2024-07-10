import { getHealthAnalyticsData } from "@actions/dashboard/analytics.action";
import DisabilityChart from "@components/charts/DisabilityChart";
import IllnessChart from "@components/charts/IllnessChart";

interface PatientHealthAnalyticsProps {
  orgId: string;
}

export const PatientHealthAnalytics = async ({ orgId }: PatientHealthAnalyticsProps) => {
  const data = await getHealthAnalyticsData(orgId);
  const illnesses: { illness: string; count: number; }[] = data.illness.map(item => ({
    illness: item.name,
    count: item._count.UserHealthConditions
  }));

  const disabilities: { disability: string; count: number; }[] = data.disability.map(item => ({
    disability: item.name,
    count: item._count.UserDisabilities
  }));

  return (
    <div className="grid gap-2 grid-cols-1 xl:grid-cols-2">
      <DisabilityChart chartData={disabilities} />
      <IllnessChart chartData={illnesses} />
    </div>
  );
};
