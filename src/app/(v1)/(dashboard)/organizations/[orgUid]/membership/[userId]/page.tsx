import OrgMemberDetails from "@components/membership/OrgMemberDetails";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import React from "react";

interface OrgMemberDetailsPageProps {
  params: Promise<{
      userId: string;
      orgUid: string;
  }>;
}

export const metadata = {
  title: "Member Details | Clinic EZ",
  description: "View and manage member details."
}

export default async function OrgMemberDetailsPage(props: OrgMemberDetailsPageProps) {
  const params = await props.params;
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
          <OrgMemberDetails userId={decodeURIComponent(params.userId)} orgUid={String(params?.orgUid)}/>
        </Suspend>
      </div>
    </>
  );
}

