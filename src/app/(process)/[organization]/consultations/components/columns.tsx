"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"

import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { GetConsultationRecords } from "@actions/consultation/consultation-record.action"
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
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Record #" />
    ),
    cell: ({ row }) => (
      <Link className="w-[90px] bg-primary text-white rounded-md px-2 py-1 font-medium text-xs hover:bg-slate-500 transition-all"
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

      return (
        <div className="flex space-x-2">
          <span className="max-w-[400px] line-clamp-2 font-medium text-primary">
            {row.getValue("subject")}
          </span>
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
          <div className="flex items-center gap-1">
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
