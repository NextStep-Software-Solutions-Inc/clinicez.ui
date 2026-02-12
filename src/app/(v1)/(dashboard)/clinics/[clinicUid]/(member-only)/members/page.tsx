import { Separator } from "@components/ui/separator";
import React from "react";
import Suspend from "@components/Suspend";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MembershipTable } from "@components/membership/MembershipTable";
import { AppRouterPageRouteOpts } from "@/types";

export const maxDuration = 40; // page timeout in seconds
export const revalidate  = 120; // revalidation interval in seconds

export const metadata: Metadata = {
  title: "Organization Memberships | Clinic EZ",
  description: "View and manage organization memberships. (Only available to organization administrators)"
};

export default async function MembershipPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const clinicUid = String(params?.clinicUid);
  // const orgAdmin = await isOrgAdmin(orgUid);
  // if(!orgAdmin) {
  //   redirect("/unauthorized");
  // }
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
          <MembershipTable orgUid={clinicUid}/>
        </Suspend>
      </div>
    </>
  );
}