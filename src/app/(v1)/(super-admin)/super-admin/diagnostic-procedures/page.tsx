import { DiagnosticProceduresTable } from "./diagnostic-procedures-table";

export const metadata = {
  title: "Diagnostic Procedures | Super Admin",
};

export default function DiagnosticProceduresPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Diagnostic Procedures
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system-wide diagnostic procedures, including PhilHealth Yakap diagnostic mappings.
        </p>
      </div>

      <DiagnosticProceduresTable />
    </div>
  );
}
