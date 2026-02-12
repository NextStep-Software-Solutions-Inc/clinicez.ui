import { Separator } from "@components/ui/separator";
import { canViewOrgMembers } from "@lib/org-utils";
import React from "react";
import Suspend from "@components/Suspend";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MembershipTable } from "@components/membership/MembershipTable";
import { AppRouterPageRouteOpts } from "@/types";
import UnauthorizedPage from "@app/(v1)/unauthorized/page";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";

export const maxDuration = 40; // page timeout in seconds
export const revalidate = 120; // revalidation interval in seconds

export const metadata: Metadata = {
  title: "Organization Memberships | Clinic EZ",
  description:
    "View and manage organization memberships. (Requires read:org:members permission)"
};

export default async function MembershipPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const orgUid = String(params?.orgUid);
  const hasPermission = await canViewOrgMembers(orgUid);

  if (!hasPermission) {
    return <UnauthorizedWarning/>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <h2 className="text-2xl font-bold tracking-tight">
            Organization Memberships
          </h2>
          <p className="text-sm text-muted-foreground">
            View and manage organization memberships. (Requires read:org:members permission)
          </p>
        </div>
        <Separator />
        <Suspend>
          <MembershipTable orgUid={orgUid} />
        </Suspend>
      </div>
    </>
  );
}