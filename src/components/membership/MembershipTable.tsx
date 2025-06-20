"use client";

import React, { useCallback } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useOrgMembers } from "@/hooks/useOrgMember";
import PageLoading from "@components/PageLoading";
import { useSearchParams } from "next/navigation";
import { ColumnFiltersState } from "@tanstack/react-table";
import { OrganizationMemberStatus } from "@/types";

interface MembershipTableProps {
  orgUid: string;
}

export const MembershipTable = ({ orgUid }: MembershipTableProps) => {
  const searchParams = useSearchParams();

  const pageNumber = Number(searchParams.get("pageNumber")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  const role = searchParams.get("role") || "";
  const statusParam = searchParams.get("status");

  const isValidStatus = (value: any): value is OrganizationMemberStatus =>
    ["ACTIVE", "SUSPENDED", "PENDING", "INACTIVE"].includes(value);

  const status = isValidStatus(statusParam) ? statusParam : undefined;

  const columnFilters: ColumnFiltersState = [];

  if (role) columnFilters.push({ id: "role", value: [role] });
  if (status && isValidStatus(status)) columnFilters.push({ id: "status", value: [status] });


  const { data: membershipRequests, isLoading } = useOrgMembers({
    orgUid,
    pageSize,
    pageNumber,
    roleId: role ? Number(role) : undefined,
    status,
  });

  const pushQueryParams = (
    page: number,
    pageSize: number,
    filters: Record<string, string>
  ) => {
    const params = new URLSearchParams();
    params.set("pageNumber", page.toString());
    params.set("pageSize", pageSize.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    window.history.pushState({}, "", `${window.location.pathname}?${params}`);
  };

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      pushQueryParams(pagination.pageIndex + 1, pagination.pageSize, {
        role,
        status: status ?? "",
      });
    },
    [role, status]
  );

  const handleFilterChange = useCallback(
    (filters: Record<string, string>) => {
      pushQueryParams(pageNumber, pageSize, filters);
    },
    [pageNumber, pageSize]
  );

  if (isLoading)
    return <PageLoading label="Fetching membership data. Please wait..." />;

  return (
    <DataTable
      data={membershipRequests?.data?.data ?? []}
      columns={columns}
      rowCount={membershipRequests?.data?.total ?? 0}
      pagination={{ pageIndex: pageNumber - 1, pageSize }}
      onPaginationChange={handlePaginationChange}
      onFilterChange={handleFilterChange}
      initialColumnFilters={columnFilters}
    />
  );
};
