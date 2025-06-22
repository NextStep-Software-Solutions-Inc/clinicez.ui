"use client";

import React, { useCallback } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useOrgMembers } from "@/hooks/useOrgMember";
import PageLoading from "@components/PageLoading";
import { useSearchParams } from "next/navigation";
import { ColumnFiltersState } from "@tanstack/react-table";
import debounce from "lodash/debounce";
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
  const user = searchParams.get("user") || "";

  const isValidStatus = (value: any): value is OrganizationMemberStatus =>
    ["ACTIVE", "SUSPENDED", "PENDING", "INACTIVE"].includes(value);

  const status = isValidStatus(statusParam) ? statusParam : undefined;

  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];

    if (user) filters.push({ id: "user", value: user });
    if (role) filters.push({ id: "role", value: [role] });
    if (status) filters.push({ id: "status", value: [status] });

    return filters;
  }, [user, role, status]);


  const { data: membershipRequests, isLoading } = useOrgMembers({
    orgUid,
    pageSize,
    pageNumber,
    searchKey: user || undefined,
    roleId: role ? Number(role) : undefined,
    status,
  });

  const pushQueryParams = (
    page: number,
    pageSize: number,
    filters: ColumnFiltersState
  ) => {
    const params = new URLSearchParams();
    params.set("pageNumber", page.toString());
    params.set("pageSize", pageSize.toString());

    filters.forEach(({ id, value }) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(id);
      } else {
        if (Array.isArray(value)) {
          params.set(id, String(value[0]));
        } else if (typeof value === "string" || typeof value === "number") {
          params.set(id, String(value));
        } else {
          console.warn(`Skipping unsupported filter value for ${id}:`, value);
        }
      }
    });

    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      pushQueryParams(pagination.pageIndex + 1, pagination.pageSize, columnFilters);
    },
    [columnFilters]
  );

  const handleFilterChange = debounce((filters: ColumnFiltersState) => {
    pushQueryParams(pageNumber, pageSize, filters);
  }, 500);

  if (isLoading)
    return <PageLoading label="Fetching membership data. Please wait..." />;

  return (
    <DataTable
      data={membershipRequests?.data?.data ?? []}
      columns={columns}
      rowCount={membershipRequests?.data?.total ?? 0}
      pagination={{ pageIndex: pageNumber - 1, pageSize }}
      initialColumnFilters={columnFilters}
      onPaginationChange={handlePaginationChange}
      onColumnFiltersChange={handleFilterChange}
    />
  );
};
