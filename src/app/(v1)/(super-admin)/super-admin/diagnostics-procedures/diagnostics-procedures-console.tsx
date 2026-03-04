"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterProceduresTab } from "./master-procedures-tab";
import { ImportCodesDialog } from "./import-codes-dialog";

export function DiagnosticsProceduresConsole() {
  const [importOpen, setImportOpen] = useState(false);

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
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Import ICD-10 / RVS
        </Button>
      </div>

      <MasterProceduresTab />

      <ImportCodesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
