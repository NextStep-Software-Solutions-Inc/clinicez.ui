"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { LabelValue } from "@components/LabelValue"
import { Separator } from "@components/ui/separator"
import { GetUserOrganizations } from "@actions/users/user-organization.action"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends GetUserOrganizations[number], TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})


  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableExpanding: true,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
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
    getFacetedUniqueValues: getFacetedUniqueValues()
  })
  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
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
              render={(row) => (
                <>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
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
                   
                  </TableRow >
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <div className="space-y-2">
                          <Each
                            of={row.original.UserRole.requirements}
                            fallback="No additional requirements needed for this role."
                            render={(requirements) => {
                              if(requirements === "student_record") {
                                return (
                                  <>
                                    <h2 className="text-lg">Student Record</h2>
                                    <Separator/>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                      <Each 
                                        of={row.original.User.StudentRecords}
                                        fallback="No student record found."
                                        render={(studentRecord) => {
                                          return (
                                            <>
                                              <LabelValue className="flex items-baseline gap-2" value="Student ID No:" label={studentRecord.studentId ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Learner Ref. No.:" label={studentRecord.lrn ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Student Level:" label={studentRecord.Level?.name}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Year/Grade Level:" label={studentRecord.YearLevel?.name ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Program/Strand:" label={studentRecord.Program?.name ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Department:" label={studentRecord.Department?.name ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="College:" label={studentRecord.College?.name ?? "N/A"}/>
                                            </>
                                          )
                                        }}
                                      />
                                    </div>
                                  </>
                                )
                              }
                              if(requirements === "employee_record") {
                                return (
                                  <>
                                    <h2 className="text-lg">Employee Record</h2>
                                    <Separator />
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                      <Each
                                        of={row.original.User.UserEmployments}
                                        fallback="No employee record found."
                                        render={(employee) => {
                                          return (
                                            <>
                                              <LabelValue className="flex items-baseline gap-2" value="Employee ID No:" label={employee?.employeeId ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Position:" label={employee?.position ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Designation:" label={employee?.designation ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="Office:" label={employee?.Office?.name ?? "N/A" }/>
                                              <LabelValue className="flex items-baseline gap-2" value="Department:" label={employee?.Department?.name ?? "N/A"}/>
                                              <LabelValue className="flex items-baseline gap-2" value="College:" label={employee?.College?.name ?? "N/A"}/>
                                            </>
                                          )
                                        }}
                                      />
                                    </div>
                                  </>
                                )
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
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
