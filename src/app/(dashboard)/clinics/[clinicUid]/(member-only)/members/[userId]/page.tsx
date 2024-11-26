import ClinicMemberDetails from "@/components/membership/ClinicMemberDetails";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import React from "react";

interface ClinicMemberDetailsPageProps {
  params: {
      userId: string;
      clinicUid: string;
  };
}

export const metadata = {
  title: "Clinic Patient Details | Clinic EZ",
  description: "View and manage member details."
}

export default function ClinicMemberDetailsPage({params}: ClinicMemberDetailsPageProps) {
  return (
    <>
      <div className="space-y-6">
        <div className="">
          <h2 className="text-2xl font-bold tracking-tight">Clinic Patient Details</h2>
          <p className="text-sm text-muted-foreground">
            View and manage member details.
          </p>
        </div>
        <Separator />
        <Suspend>
          <ClinicMemberDetails userId={decodeURIComponent(params.userId)} clinicUid={String(params?.clinicUid)}/>
        </Suspend>
      </div>
    </>
  );
}

