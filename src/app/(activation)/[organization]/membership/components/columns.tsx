"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"

import { labels, priorities, statuses } from "../data/data"
import { MembershipRequestSchema, membershipRequestSchema } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { format } from "date-fns"
import { ExternalLink } from "lucide-react"

export const columns: ColumnDef<MembershipRequestSchema>[] = [
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
  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Application #" />
  //   ),
  //   cell: ({ row }) => (
  //     <Link className="w-[110px] bg-primary text-white rounded-md px-2 py-1 text-sm font-medium hover:bg-slate-500 transition-all"
  //       href={{
  //         pathname: `consultations/${row.getValue("id")}`
  //       }}
  //     >
  //       APP-{row.getValue("id")}
  //     </Link>
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "Application Date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Application Date" />
    ),
    cell: ({ row }) => {
      const dateApplied = format(row.original.createdAt, "PP")

      if (!dateApplied) {
        return null
      }

      return (
        <div className="flex items-center">
          <span>{dateApplied}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const label = row.original.role.name

      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {label}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "User",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = `${row.original.User?.firstName ?? "-"} ${row.original.User?.lastName ?? "-"}`
      
      if (!user) {
        return null
      }

      return (
        <div className="flex items-center">
          <Link 
            target="_blank"
            href={`/user/${row.original.User?.userId}/phr`} 
            className="flex gap-2 items-center hover:underline cursor-pointer"
          >{user}<ExternalLink className="w-4 h-4"/></Link>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Accepted By",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Accepted By" />
    ),
    cell: ({ row }) => {
      const user = `${row.original.AcceptedBy?.firstName ?? "-"} ${row.original.AcceptedBy?.lastName ?? "-"}`
      
      if (!user) {
        return null
      }

      return (
        <div className="flex items-center">
          <span>{user}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
      const SuspendedBadge = <Badge variant="destructive">{status.label}</Badge>
      const ActiveBadge = <Badge variant="secondary" className="bg-green-500 text-white">{status.label}</Badge>
      return (
        <div className="flex items-center">
          {!["ACTIVE", "SUSPENDED"].includes(status.value) && status.label}
          {status.value === "ACTIVE" && ActiveBadge}
          {status.value === "SUSPENDED" && SuspendedBadge}
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
      const membershipRequest = membershipRequestSchema.parse(row.original)
      return (
        (
          <DropdownMenuProvider>
            <DataTableRowActions applicationRequest={membershipRequest} />
          </DropdownMenuProvider>
        )
      )
    }
  },
]
