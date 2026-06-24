import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Master Lists",
  description: "PhilHealth Konsulta Master Lists.",
};

const MASTER_LISTS = [
  { name: "Medicine", slug: "medicine", desc: "PhilHealth medicine library" },
  { name: "Medicine Form", slug: "medicine-form", desc: "Medicine forms (e.g. tablet, syrup)" },
  { name: "Medicine Strength", slug: "medicine-strength", desc: "Medicine strengths (e.g. 500mg)" },
  { name: "Medicine Salt", slug: "medicine-salt", desc: "Medicine salts" },
  { name: "Medicine Package", slug: "medicine-package", desc: "Medicine packages" },
  { name: "Medicine Unit", slug: "medicine-unit", desc: "Medicine units" },
  { name: "Diagnostic Category", slug: "diagnostic-category", desc: "Categories for diagnostic requests" },
  { name: "ICD 10 Codes", slug: "icd", desc: "International Classification of Diseases" },
  { name: "Z-Scores", slug: "zscore", desc: "Z-Scores for pediatric vitals" },
  { name: "NCD Assessment", slug: "ncdq", desc: "Non-Communicable Disease Questionnaires" },
  { name: "Abdomen Library", slug: "abdomen", desc: "Abdomen examination findings" },
  { name: "Chest Library", slug: "chest", desc: "Chest examination findings" },
  { name: "Chest X-Ray Findings", slug: "chestxray-findings", desc: "Standard chest X-ray findings" },
];

export default function MasterListsIndex() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Lists</h1>
        <p className="text-muted-foreground mt-2">Manage the foundational PhilHealth master data used across all clinics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {MASTER_LISTS.map((list) => (
          <Link href={`/super-admin/master-lists/${list.slug}`} key={list.slug} className="block transition-all hover:scale-[1.02]">
            <Card className="h-full hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    <CardDescription className="mt-1">{list.desc}</CardDescription>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
