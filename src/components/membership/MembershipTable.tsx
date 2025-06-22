"use client";

import React, { useCallback, useMemo, useState } from "react";
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

  const roleIds = searchParams.getAll("roleId");
  const statuses = searchParams.getAll("status");
  const user = searchParams.get("user") || "";

  const validateMembershipStatus = (value: unknown): value is OrganizationMemberStatus =>
    typeof value === "string" &&
    ["ACTIVE", "SUSPENDED", "PENDING", "INACTIVE"].includes(value);

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (user) filters.push({ id: "user", value: user });
    if (roleIds.length > 0) filters.push({ id: "roleId", value: roleIds });
    const validStatuses = statuses.filter(validateMembershipStatus);
    if (validStatuses.length > 0) filters.push({ id: "status", value: validStatuses });
    return filters;
  }, [user, roleIds, statuses]);

  const [activeFilters, setActiveFilters] = useState<ColumnFiltersState>(columnFilters);

  const { data: membershipRequests, isLoading } = useOrgMembers({
    orgUid,
    pageSize,
    pageNumber,
    roleId: roleIds.length ? Number(roleIds[0]) : undefined,
    searchKey: user || undefined,
    status: statuses.find(validateMembershipStatus),
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
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(id, String(v)));
      } else {
        params.set(id, String(value));
      }
    });

    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      pushQueryParams(pagination.pageIndex + 1, pagination.pageSize, activeFilters);
    },
    [activeFilters]
  );

  const handleFilterChange = debounce((filters: ColumnFiltersState) => {
    setActiveFilters(filters);
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
