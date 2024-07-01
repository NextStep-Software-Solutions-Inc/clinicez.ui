"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { $Enums } from "@prisma/client"
import { getOrganizationRolesAction } from "@actions/organization.action"
import React, { useEffect } from "react"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [orgRoles, setOrgRoles] = React.useState<{label: string, value: string}[]>([])
  const isFiltered = table.getState().columnFilters.length > 0
  const membershipStatuses = Object.values($Enums.UserOrganizationStatus).map((status) => ({
    label: status.split("").map((char, index) => (index === 0 ? char : char.toLowerCase())).join(""),
    value: status,
  }))

  useEffect(() => {
    (async () => {
      const roles = await getOrganizationRolesAction()
      setOrgRoles(roles.map(role => ({
        label: role.name,
        value: role.name,
      })))
    })()
  }, [])

  
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
            options={orgRoles}
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
