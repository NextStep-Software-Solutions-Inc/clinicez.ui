import React from "react";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { getUserOrganizationsAction } from "@actions/organization.action";

interface MembershipTableProps {
  orgId: string;
}

export const MembershipTable = async ({ orgId }: MembershipTableProps) => {

  const membershipRequests = await getUserOrganizationsAction({ orgId });

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
  }));

  return (
    <DataTable data={mappedMembershipRequests} columns={columns} />
  );
};
