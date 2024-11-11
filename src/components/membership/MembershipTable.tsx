"use client";

import React from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useUserOrganizations } from "@hooks/useUserOrganization";
import PageLoading from "@components/PageLoading";
import { useSearchParams } from "next/navigation";
interface MembershipTableProps {
  orgUid: string;
}

export const MembershipTable = ({ orgUid }: MembershipTableProps) => {
  const searchParams = useSearchParams();
  const pageNumber = Number(searchParams.get("pageNumber")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const {data: membershipRequests, isLoading} = useUserOrganizations({ orgUid, pageSize, pageNumber });

  // pust the page number and page size to the query params
  const pushQueryParams = (page: number, pageSize: number) => {
    const params = new URLSearchParams();
    params.append("pageNumber", page.toString());
    params.append("pageSize", pageSize.toString());
    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
  }

  if(isLoading) return <PageLoading label="Fetching membership data. Please wait..." />;
  return (
    <DataTable 
      data={membershipRequests?.data ?? []} 
      columns={columns} rowCount={membershipRequests?.total ?? 0}
      pagination={{pageIndex: pageNumber - 1, pageSize}}
      onPaginationChange={(pagination)=> {
        pushQueryParams(pagination.pageIndex + 1, pagination.pageSize);
      }}
    />
  );
};
