import MemberDetails from "@components/membership/MemberDetails";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import React from "react";

interface MemberDetailsPageProps {
    params: {
        userId: string;
        organization: string;
    };
}

export const metadata = {
  title: "Member Details | Clinic EZ",
  description: "View and manage member details."
}

export default function MemberDetailsPage({params}: MemberDetailsPageProps) {
  return (
    <>
      <div className="space-y-6">
        <div className="">
          <h2 className="text-2xl font-bold tracking-tight">Member Details</h2>
          <p className="text-sm text-muted-foreground">
            View and manage member details.
          </p>
        </div>
        <Separator />
        <Suspend>
          <MemberDetails userId={decodeURIComponent(params.userId)} orgUid={params.organization}/>
        </Suspend>
      </div>
    </>
  );
}

