import { MasterListConsole } from "@/components/super-admin/MasterListConsole";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Master List Management",
  description: "Manage PhilHealth Master Lists.",
};

const VALID_SLUGS = [
  "diagnostic-category",
  "medicine",
  "medicine-form",
  "medicine-strength",
  "medicine-salt",
  "medicine-package",
  "medicine-unit",
  "icd",
  "zscore",
  "ncdq",
  "abdomen",
  "chest",
  "chestxray-findings"
];

export default function MasterListPage({ params }: { params: { slug: string } }) {
  if (!VALID_SLUGS.includes(params.slug)) {
    notFound();
  }

  return <MasterListConsole slug={params.slug} />;
}
