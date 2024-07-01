import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Separator } from "@components/ui/separator";
import { isOrgAdmin } from "@lib/protect-org";
import React from "react";
import { UnauthorizedWarning } from "./UnauthorizedWarning";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import Suspend from "@components/Suspend";
import { getUserOrganizationsAction } from "@actions/organization.action";

export const maxDuration = 30; // page timeout in seconds

async function MembershipPage({params}: AppRouterPageRouteOpts) {
  const membershipRequests = await getUserOrganizationsAction({orgId: params?.organization as string});

  const mappedMembershipRequests: ApplicationRequest[] = membershipRequests.map((request) => ({
    id: request.id,
    role: {
      id: request.role,
      name: request.UserRole.name
    },
    status: request.status.toString(),
    createdAt: request.createdAt,
    User: {
      id: request.User.id,
      picture: request.User.picture,
      userId: request.User.userId,
      firstName: request.User?.firstName ?? "",
      lastName: request.User?.lastName ?? "",
      gender: request.User.gender,
      dob: request.User.dob
    },
    AcceptedBy: request.AcceptedBy ? {
      id: request.AcceptedBy?.id,
      userId: request.AcceptedBy?.userId,
      firstName: request.AcceptedBy?.firstName,
      lastName: request.AcceptedBy?.lastName
    } : null,
  }))
  
  if(!(await isOrgAdmin())) {
    return <UnauthorizedWarning />;
  }

  return (
    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight"><code className="bg-slate-200 py-1 px-4 rounded">{params?.organization}</code> Membership Application Request</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {`You are about to join an organization as a member. Please be aware that you will be able to access the organization's resources and services once you are accepted.`}
        </p>
      </div>
    
      <Separator />
   
      <Suspend>
        <DataTable data={mappedMembershipRequests} columns={columns} />
      </Suspend>
  
    </div>

  );
}
export default withPageAuthRequired(MembershipPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${params?.organization}/membership?${searchStr}`;
  }
});
