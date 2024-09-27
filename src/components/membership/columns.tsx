"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@components/ui/badge"

import { $Enums } from "@prisma/common/client"

export const statuses = Object.values($Enums.UserOrganizationStatus).map((status) => ({
  label: status.split("").map((char, index) => (index === 0 ? char : char.toLowerCase())).join(""),
  value: status,
}))

import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { differenceInCalendarYears } from "date-fns"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import ConditionalRender from "@components/utils/ConditionalRender"
import { Button } from "@components/ui/button"
import { GetUserOrganizations } from "@actions/users/user-organization.action"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
dayjs.extend(utc)

export const columns: ColumnDef<GetUserOrganizations["data"][number]>[] = [
  {
    id: "select",
    size: 1,
    // header: ({ table }) => (
    //   <Checkbox
    //     checked={
    //       table.getIsAllPageRowsSelected() ||
    //       (table.getIsSomePageRowsSelected() && "indeterminate")
    //     }
    //     onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //     aria-label="Select all"
    //     className="translate-y-[2px]"
    //   />
    // ),
    cell: ({ row, getValue }) => (
      <div className="flex gap-2 items-center">
        {/* <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        /> */}
        {
          <Button 
            onClick={() => row.toggleExpanded()}
            size="icon" variant="ghost"
          >{row.getIsExpanded()? <ChevronDown size={20}/>:<ChevronRight size={20}/>}
          </Button>
        }
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    footer: props => props.column.id,
  },
  {
    accessorKey: "application-date",
    size: 5,
    accessorFn: (row) => row.createdAt.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZone: "Asia/Manila"
    }),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Application Date & Time" />
    ),
    cell: ({ row }) => {
      const dateApplied = dayjs(row.original.createdAt).format("llll")
      if (!dateApplied) {
        return null
      }

      return (
        <div className="flex items-center">
          <span>{dateApplied}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "user",
    size: 10,
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
              className="hover:underline cursor-pointer"
            >
              {user} <ExternalLink className="w-4 h-4 ml-3 inline-block"/>
            </Link>
            <ConditionalRender condition={!!gender && !!dob}>
              <div className="text-xs text-muted-foreground">{gender && gender.charAt(0)} / {dob && differenceInCalendarYears(new Date(), dob)}</div>
            </ConditionalRender>
          </div>
          
        </div>
      )
    }
  },
  {
    accessorKey: "accepted-by",
    size: 5,
    accessorFn: (row) => `${row.AcceptedBy?.firstName ?? "-"} ${row.AcceptedBy?.lastName ?? "-"}`,
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
  },
  {
    accessorKey: "role",
    size: 1,
    accessorFn: (row) => row.UserRole.name,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const label = row.original.UserRole.name

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
    accessorKey: "status",
    size: 1,
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
  },
  {
    id: "actions",
    size: 1,
    cell: ({ row }) => {
      return (
        (
          <DropdownMenuProvider>
            <DataTableRowActions applicationRequest={row.original} />
          </DropdownMenuProvider>
        )
      )
    }
  },
]
