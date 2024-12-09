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
  title: "My Clinic Profile | Clinic EZ",
  description: "Manage your clinic profile and membership details.",
}

export default function ClinicMemberDetailsPage({params}: ClinicMemberDetailsPageProps) {
  return (
    <>
      <div className="space-y-6">
        <div className="">
          <h2 className="text-2xl font-bold tracking-tight">My Clinic Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your clinic profile and membership details.
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

