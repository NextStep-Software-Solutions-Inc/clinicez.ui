import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Separator } from "@components/ui/separator";
import { isOrgAdmin } from "@lib/org-utils";
import React from "react";
import Suspend from "@components/Suspend";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MembershipTable } from "@components/membership/MembershipTable";

export const maxDuration = 40; // page timeout in seconds
export const revalidate  = 120; // revalidation interval in seconds

export const metadata: Metadata = {
  title: "Organization Memberships | Clinic EZ",
  description: "View and manage organization memberships. (Only available to organization administrators)"
};

async function MembershipPage({params}: AppRouterPageRouteOpts) {
  const orgUid = String(params?.orgUid);
  const orgAdmin = await isOrgAdmin(orgUid);
  if(!orgAdmin) {
    redirect("/unauthorized");
  }
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <h2 className="text-2xl font-bold tracking-tight">Organization Memberships</h2>
          <p className="text-sm text-muted-foreground">
            View and manage organization memberships. (Only available to organization administrators)
          </p>
        </div>
        <Separator />
        <Suspend>
          <MembershipTable orgUid={orgUid}/>
        </Suspend>
      </div>
    </>
  );
}
export default withPageAuthRequired(MembershipPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${String(params?.orgUid)}/membership?${searchStr}`;
  }
});