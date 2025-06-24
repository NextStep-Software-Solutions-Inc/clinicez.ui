"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import Each from "@components/utils/Each"
import { cn } from "@lib/utils"
import { GetConsultationTickets } from "@actions/consultation/consultation-ticket.action"
import { CheckedState } from "@radix-ui/react-checkbox"


export type ConsultationTableOptions = {
  showArchived: CheckedState
}
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  options?: ConsultationTableOptions
  onOptionsChange?: (options: ConsultationTableOptions) => void
  initialColumnFilters?: ColumnFiltersState;
}

export function DataTable<TData extends NonNullable<GetConsultationTickets["data"]>[number], TValue>({
  columns,
  data,
  options,
  onOptionsChange,
  initialColumnFilters
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters ?? [])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleOptionsChange = (options: ConsultationTableOptions) => {
    onOptionsChange?.(options)
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        options={{
          showArchived: options?.showArchived === true
        }}
        onOptionsChange={handleOptionsChange} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <Each
              of={table.getHeaderGroups()}
              render={(headerGroup) => (
                <TableRow>
                  <Each
                    of={headerGroup.headers}
                    render={(header) => {
                      return (
                        <TableHead colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    }}
                  />
                </TableRow>
              )}
            />
          </TableHeader>
          <TableBody>
            <Each
              of={table.getRowModel().rows}
              render={(row) => {
                return (
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(row.original.isArchived && "bg-destructive/5")}
                  >
                    <Each
                      of={row.getVisibleCells()}
                      render={(cell) => (
                        <TableCell>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )}
                    />
  
                  </TableRow>
                )
              }}
              fallback={(
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                  No results.
                  </TableCell>
                </TableRow>
              )}
            />
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
