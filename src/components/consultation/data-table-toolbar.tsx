"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { Checkbox } from "@components/ui/checkbox"
import { ConsultationTableOptions } from "./data-table"
import { CheckedState } from "@radix-ui/react-checkbox"
import { useState } from "react"
import { useSystems } from "@hooks/useSystem"
import { useParams } from "next/navigation"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  options?: ConsultationTableOptions
  onOptionsChange?: (options: ConsultationTableOptions) => void
}

export function DataTableToolbar<TData>({
  table,
  options,
  onOptionsChange
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [showArchived, setShowArchived] = useState(options?.showArchived === true)
  const params = useParams<{organization: string}>()
  const {data: systems} = useSystems(params.organization)

  const handleShowArchivedChange = (checked: CheckedState) => {
    setShowArchived(checked === true)
    onOptionsChange?.({
      showArchived: checked
    })
  }
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter consultation records..."
          value={(table.getColumn("ticket")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("ticket")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={[
              {
                label: "Pending",
                value: "PENDING",
              },
              {
                label: "Resolved",
                value: "RESOLVED",
              },
              {
                label: "Processing",
                value: "PROCESSING",
              }
            ]}
          />
        )}
        {table.getColumn("system") && (
          <DataTableFacetedFilter
            column={table.getColumn("system")}
            title="System"
            options={(systems ?? [])?.map((system) => ({
              label: system.name,
              value: system.name,
            }))}
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
      <ShowArchivedCheckbox
        checked={showArchived}
        onCheckedChange={handleShowArchivedChange}
      />
      <DataTableViewOptions table={table} />
    </div>
  )
}


interface ShowArchivedCheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: CheckedState) => void
}
export const ShowArchivedCheckbox = ({onCheckedChange, checked}:ShowArchivedCheckboxProps) => {

  return (
    <div className="flex items-center space-x-2 mx-2">
      <Checkbox 
        checked={checked}
        onCheckedChange={onCheckedChange}
        id="show-archived"
      />
      <label
        htmlFor="show-archived"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Show archived
      </label>
    </div>
  )

}