"use client";

import React from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useOrgMembers } from "@/hooks/useOrgMember";
import PageLoading from "@components/PageLoading";
import { useSearchParams } from "next/navigation";
import { ColumnFiltersState } from "@tanstack/react-table";
import debounce from "lodash/debounce";
interface MembershipTableProps {
  orgUid: string;
}

export const MembershipTable = ({ orgUid }: MembershipTableProps) => {
  const searchParams = useSearchParams();
  const pageNumber = Number(searchParams.get("pageNumber")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const searchKey = searchParams.get("user") || "";
  const [search, setSearch] = React.useState(searchKey || undefined);

  const { data: membershipRequests, isLoading } = useOrgMembers({
    orgUid,
    pageSize,
    pageNumber,
    searchKey: search
  });

  // pust the page number and page size to the query params
  const pushPaginationQueryParams = (page: number, pageSize: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("pageNumber", page.toString());
    params.set("pageSize", pageSize.toString());

    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  const pushFilterQueryParams = (columnFilters: ColumnFiltersState) => {
    const params = new URLSearchParams(window.location.search);

    // Remove "user" param if no filters
    if (columnFilters.length === 0) {
      params.delete("user");
      setSearch(undefined);
    }

    columnFilters.forEach(({ id, value }) => {

      if (id === "user") {
        setSearch(value as string);
      }

      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        typeof value === "object";

      if (isEmpty) {
        params.delete(id);
      } else {
        params.set(id, String(value));
      }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  const initialColumnFilters = React.useMemo(() => {
    return [
      {
        id: "user",
        value: search,
      }
    ];
  }, [search]) satisfies ColumnFiltersState;

  if (isLoading) return <PageLoading label="Fetching membership data. Please wait..." />;

  return (
    <DataTable
      data={membershipRequests?.data?.data ?? []}
      columns={columns}
      rowCount={membershipRequests?.data?.total ?? 0}
      pagination={{ pageIndex: pageNumber - 1, pageSize }}
      initialColumnFilters={initialColumnFilters}
      onPaginationChange={(pagination) => {
        pushPaginationQueryParams(pagination.pageIndex + 1, pagination.pageSize);
      }}
      onColumnFiltersChange={debounce(pushFilterQueryParams, 500)}
    />
  );
};
