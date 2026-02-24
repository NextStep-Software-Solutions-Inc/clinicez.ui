"use client";

import { MasterProceduresTab } from "./master-procedures-tab";

export function DiagnosticsProceduresConsole() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Master Procedures Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system-wide master procedures. Clinic-specific procedures are configured in clinic management.
          </p>
        </div>
      </div>

      <MasterProceduresTab />
    </div>
  );
}
