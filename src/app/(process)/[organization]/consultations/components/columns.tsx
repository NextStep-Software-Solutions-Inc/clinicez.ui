"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge, BadgeProps } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"

import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { GetConsultationRecords } from "@actions/consultation/consultation-ticket.action"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)


export const columns: ColumnDef<GetConsultationRecords["data"][number]>[] = [
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
    accessorKey: "ticket",
    accessorFn: (row) => `${row.subject} ${row.id}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ticket #" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <Link className=""
            href={{
              pathname: `consultations/${row.original.id}`
            }}
          >
            <div className="max-w-[350px] line-clamp-2 ">
              <div className="text-primary font-medium">
                Ticket #{row.original.id}
              </div>
              <span className="text-xs">{row.original.subject ?? "-"}</span>
            </div>
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: "patient",
    accessorFn: (row) => row.Appointment.Requesters.map((requester) => requester.email).join(", "),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="text-wrap">{row.original.Appointment.Requesters.map((requester) => requester.email).join(", ")}</div>
          <div className="flex flex-wrap items-center gap-1">
            <Badge>{row.original.Appointment.AppointmentAttribute?.Service?.name}</Badge>
            <Badge variant="outline">{row.original.Appointment.AppointmentAttribute?.AppointmentType.name}</Badge>
            <Badge variant="secondary">{row.original.Appointment.AppointmentAttribute?.AppointmentMode.name}</Badge>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Created" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center text-xs">
          <span>{dayjs(row.getValue("createdAt")).format("lll")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    accessorFn: (row) => row.ConsultationRecordAttribute?.status,
    filterFn: (row, id, filterValues) => {
      return filterValues.includes(row.original.ConsultationRecordAttribute?.status)
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const badgeVariant: Record<string, BadgeProps["variant"]> = {
        PENDING: "destructive",
        RESOLVED: "default",
        PROCESSING: "outline",
      } as const
      return (
        <div className="flex items-center text-xs">
          <Badge variant={badgeVariant[row.original.ConsultationRecordAttribute?.status as keyof typeof badgeVariant]}>{row.original.ConsultationRecordAttribute?.status}</Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        (
          <DropdownMenuProvider>
            <DataTableRowActions consultation={row.original} />
          </DropdownMenuProvider>
        )
      )
    }
  },
]
