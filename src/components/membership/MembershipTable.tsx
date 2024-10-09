"use client";

import React from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useUserOrganizations } from "@hooks/useUserOrganization";
import PageLoading from "@components/PageLoading";
interface MembershipTableProps {
  orgId: string;
}

export const MembershipTable = ({ orgId }: MembershipTableProps) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const {data: membershipRequests, isLoading} = useUserOrganizations({ orgId, pageSize, pageNumber: page });

  if(isLoading) return <PageLoading label="Fetching membership data. Please wait..." />;
  return (
    <DataTable 
      data={membershipRequests?.data ?? []} 
      columns={columns} rowCount={membershipRequests?.total ?? 0}
      onPaginationChange={(pagination)=> {
        if(typeof pagination === "object"){
          setPage(pagination.pageIndex + 1);
          setPageSize(pagination.pageSize);
        }
      }}
    />
  );
};
