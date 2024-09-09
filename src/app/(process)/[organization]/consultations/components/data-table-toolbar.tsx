"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter consultation records..."
          value={(table.getColumn("subject")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("subject")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("service") && (
          <DataTableFacetedFilter
            column={table.getColumn("service")}
            title="Service"
            options={[
              {
                label: "Consultation",
                value: "consultation",
              },
              {
                label: "Appointment",
                value: "appointment",
              }
            ]}
          />
        )}
        {table.getColumn("system") && (
          <DataTableFacetedFilter
            column={table.getColumn("system")}
            title="System"
            options={[
              {
                label: "Teleconsultation",
                value: "teleconsultation",
              },
              {
                label: "In-person",
                value: "in-person",
              }
            ]}
          />
        )}
        {table.getColumn("mode") && (
          <DataTableFacetedFilter
            column={table.getColumn("mode")}
            title="Mode"
            options={[
              {
                label: "Video",
                value: "video",
              },
              {
                label: "Audio",
                value: "audio",
              }
            ]}
          />
        )}
        {table.getColumn("appointmentType") && (
          <DataTableFacetedFilter
            column={table.getColumn("appointmentType")}
            title="Appointment Type"
            options={[
              {
                label: "Scheduled",
                value: "scheduled",
              },
              {
                label: "On-demand",
                value: "on-demand",
              }
            ]}
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
