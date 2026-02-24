import { redirect } from "next/navigation";
import { getCachedSession } from "@actions/session.action";
import { getDashboardOptionsAction } from "@actions/dashboard/dashboard-links.action";
import SelectDashboardClient from "@/components/v2/dashboard/SelectDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Select Dashboard | ClinicEZ",
  description: "Choose where you want to go",
};

export default async function SelectDashboardPage() {
  const session = await getCachedSession();

  if (!session) {
    redirect("/sign-in");
  }

  const options = await getDashboardOptionsAction();

  const userName = session.user.given_name ?? "";

  return <SelectDashboardClient options={options} userName={userName} />;
}
