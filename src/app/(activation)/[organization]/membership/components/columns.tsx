"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"

import { statuses } from "../data/data"
import { MembershipRequestSchema, membershipRequestSchema } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { format, differenceInCalendarYears } from "date-fns"
import { ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import ConditionalRender from "@components/utils/ConditionalRender"

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
  {
    accessorKey: "application-date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Application Date" />
    ),
    cell: ({ row }) => {
      const dateApplied = format(row.original.createdAt, "PPp")

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
    accessorFn: (row) => row.role.name,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
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
    accessorKey: "user",
    accessorFn: (row) => `${row.User?.firstName} ${row.User?.lastName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const user = `${row.original.User?.firstName} ${row.original.User?.lastName}`
      
      if (!user) {
        return null
      }

      const dob = row.original.User.dob
      const gender = row.original.User.gender
      return (
        <div className="flex items-center gap-2">
          <ConditionalRender condition={!!row.original.User.picture || !!user.trim()}>
            <Avatar>
              <AvatarImage className="object-cover" src={row.original.User?.picture ?? ""} alt={user} />
              <AvatarFallback>{user.split(" ").map(n => n.charAt(0)).join("")}</AvatarFallback>
            </Avatar>

          </ConditionalRender>
          <div>
            <Link 
              target="_blank"
              href={`/user/${row.original.User?.userId}/phr`} 
              className="flex gap-2 items-center hover:underline cursor-pointer"
            >
              {user} <ExternalLink className="w-4 h-4"/>
            </Link>
            <ConditionalRender condition={!!gender && !!dob}>
              <span className="text-xs text-gray-400">{gender && gender.charAt(0)} / {dob && differenceInCalendarYears(new Date(), dob)}</span>
            </ConditionalRender>
          </div>
          
        </div>
      )
    }
  },
  {
    accessorKey: "accepted-by",
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
      const PendingBadge = <Badge variant="secondary" className="bg-blue-500 text-white">{status.label}</Badge>
      const SuspendedBadge = <Badge variant="destructive">{status.label}</Badge>
      const ActiveBadge = <Badge variant="secondary" className="bg-green-500 text-white">{status.label}</Badge>
      return (
        <div className="flex items-center">
          {!["ACTIVE", "SUSPENDED", "PENDING"].includes(status.value) && status.label}
          {status.value === "ACTIVE" && ActiveBadge}
          {status.value === "SUSPENDED" && SuspendedBadge}
          {status.value === "PENDING" && PendingBadge}
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
