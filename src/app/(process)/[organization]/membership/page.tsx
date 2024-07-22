import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Separator } from "@components/ui/separator";
import { isOrgAdmin } from "@lib/protect-org";
import React from "react";
import Suspend from "@components/Suspend";
import { MembershipTable } from "./MembershipTable";
import { redirect } from "next/navigation";

export const maxDuration = 30; // page timeout in seconds
export const revalidate  = 60; // revalidation interval in seconds

async function MembershipPage({params}: AppRouterPageRouteOpts) {
  const orgId = params?.organization as string;
  const orgAdmin = await isOrgAdmin(orgId);
  if(!orgAdmin) {
    redirect("/unauthorized");
  }
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <h2 className="text-2xl font-bold tracking-tight">Membership Application Request</h2>
          <p className="text-sm text-muted-foreground">
            View and manage membership application requests for your organization. (Only available to organization administrators)
          </p>
        </div>
        <Separator />
        <Suspend>
          <MembershipTable orgId={orgId}/>
        </Suspend>
      </div>
    </>
  );
}
export default withPageAuthRequired(MembershipPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${params?.organization}/membership?${searchStr}`;
  }
});