import { Metadata } from "next";
import PhysicalExamLibraryTable from "./physical-exam-library-table";
import { getPhysicalExamLibrariesAction } from "@/actions/super-admin/physical-exam-library.action";

export const metadata: Metadata = {
  title: "Super Admin | Physical Exam Library",
  description: "Manage physical examination libraries.",
};

export default async function PhysicalExamLibraryPage() {
  const { data } = await getPhysicalExamLibrariesAction();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Physical Exam Library</h2>
      </div>
      <PhysicalExamLibraryTable initialData={data || []} />
    </div>
  );
}
