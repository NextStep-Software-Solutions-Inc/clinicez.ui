import { HealthConditionsTable } from "./health-conditions-table";

export default function HealthConditionsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Health Conditions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage health conditions and PhilHealth MDISEASE mappings
          </p>
        </div>
      </div>
      <HealthConditionsTable />
    </div>
  );
}
