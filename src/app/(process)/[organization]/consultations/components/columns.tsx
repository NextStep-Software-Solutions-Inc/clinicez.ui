"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"

import { labels, priorities, statuses } from "../data/data"
import { ConsultationRecordSchema, consultationRecordSchema } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"

export const columns: ColumnDef<ConsultationRecordSchema>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Consultation Record #" />
    ),
    cell: ({ row }) => (
      <Link className="w-[110px] bg-primary text-white rounded-md px-2 py-1 text-sm font-medium"
        href={{
          pathname: `consultations/${row.getValue("id")}`
        }}
      >
        CONSULT-{row.getValue("id")}
      </Link>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline" className="ring-1 ring-destructive text-destructive">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("subject")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      )

      if (!status) {
        return null
      }

      return (
        <div className="flex w-[120px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("priority")
      )

      if (!priority) {
        return null
      }

      return (
        <div className="flex items-center">
          {priority.icon && (
            <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{priority.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const consultationRecord = consultationRecordSchema.parse(row.original)
      return (
        (
          <DropdownMenuProvider>
            <DataTableRowActions consultation={consultationRecord} />
          </DropdownMenuProvider>
        )
      )
    }
  },
]
