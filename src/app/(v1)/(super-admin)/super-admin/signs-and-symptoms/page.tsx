import { Metadata } from "next";
import SignsAndSymptomsTable from "./signs-and-symptoms-table";
import { getSignsAndSymptomsAction } from "@/actions/super-admin/sign-and-symptom.action";

export const metadata: Metadata = {
  title: "Super Admin | Signs and Symptoms Library",
  description: "Manage signs and symptoms libraries.",
};

export default async function SignsAndSymptomsPage() {
  const { data } = await getSignsAndSymptomsAction();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Signs and Symptoms Library</h2>
      </div>
      <SignsAndSymptomsTable initialData={data || []} />
    </div>
  );
}
