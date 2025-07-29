import { AppRouterPageRouteOpts } from "@/types";
import { Separator } from "@components/ui/separator";
import React from "react";

export default async function PrescriptionDetailsPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  return(
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight flex-1">
              Prescription #{params?.prescriptionId}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            View and manage prescription
          </p>
        </div>
        <Separator />
      </div>
    </>
  );
}
