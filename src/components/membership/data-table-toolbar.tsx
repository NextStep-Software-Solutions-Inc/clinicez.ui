"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { $Enums } from "@prisma/client"
import React from "react"
import { useOrganizationRoles } from "@/hooks/useOrganizationRole"
import { useParams } from "next/navigation"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const membershipStatuses = Object.values({ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", PENDING: "PENDING", SUSPENDED: "SUSPENDED"}).map((status) => ({
    label: status.split("").map((char, index) => (index === 0 ? char : char.toLowerCase())).join(""),
    value: status,
  }))
  const {orgUid} = useParams<{orgUid: string}>()
  const {data: orgRoles } = useOrganizationRoles({orgUid})
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter membership records..."
          value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("user")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title="Role"
            options={(orgRoles?? []).map(role => ({
              label: role.name,
              value: role.name,
            }))}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={membershipStatuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
