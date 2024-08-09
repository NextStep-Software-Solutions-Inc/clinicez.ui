import React from "react";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { getUserOrganizationsAction } from "@actions/users/user-organization.action";

interface MembershipTableProps {
  orgId: string;
}

export const MembershipTable = async ({ orgId }: MembershipTableProps) => {

  const membershipRequests = await getUserOrganizationsAction({ orgId, pageSize: 200 });

  return (
    <DataTable data={membershipRequests} columns={columns} />
  );
};
