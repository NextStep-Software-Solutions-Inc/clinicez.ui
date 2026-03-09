"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge, BadgeProps } from "@components/ui/badge"
import { Checkbox } from "@components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import ConsultationTicketTableRowActions from "./ConsultationTicketTableRowActions"
import Link from "next/link"
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import { GetConsultationTickets } from "@actions/consultation/consultation-ticket.action"
import dayjs from "@lib/day-utils"

/**
 * Consultation Ticket Table Columns
 * 
 * The "ticket" column uses a custom filterFn to enable search across:
 * - Patient name (first, middle, last, suffix)
 * - Ticket subject
 * - Ticket ID
 * 
 * Search works across ALL pages because getFilteredRowModel() is applied
 * before getPaginationRowModel() in the data-table component.
 * This follows TanStack Table best practices for client-side filtering.
 */
export const columns: ColumnDef<NonNullable<GetConsultationTickets["data"]>[number]>[] = [
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
    accessorFn: (row) => {
      const patient = row.Appointment?.Requesters?.[0]?.User;
      const patientName = patient
        ? `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        : "";
      return `${row.subject ?? ""} ${row.id} ${patientName}`;
    },
    filterFn: (row, columnId, filterValue) => {
      // Custom filter function for case-insensitive search across ticket data
      const searchValue = String(filterValue).toLowerCase().trim();
      if (!searchValue) return true;

      const patient = row.original.Appointment?.Requesters?.[0]?.User;
      const patientName = patient
        ? `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.toLowerCase().trim()
        : "";
      const subject = (row.original.subject ?? "").toLowerCase();
      const ticketId = String(row.original.id);

      // Search in patient name, subject, or ticket ID
      return patientName.includes(searchValue) ||
        subject.includes(searchValue) ||
        ticketId.includes(searchValue);
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ticket #" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <Link
            className=""
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
      );
    },
  },
  {
    accessorKey: "system",
    accessorFn: (row) => row.System?.name,
    filterFn: (row, id, filterValues) => {
      return row.original.System?.name ? filterValues.includes(row.original.System.name) : false
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="System" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <Requester requester={row.original.Appointment?.Requesters[0].User!} />
          <div className="flex flex-wrap items-center gap-1">
            {row.original.System?.name && <Badge>{row.original.System.name}</Badge>}
            <Badge variant="outline">{row.original.Appointment?.AppointmentAttribute?.Service?.name}</Badge>
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
    accessorFn: (row) => row.ConsultationTicketAttribute?.status,
    filterFn: (row, id, filterValues) => {
      return filterValues.includes(row.original.ConsultationTicketAttribute?.status)
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
          <Badge variant={badgeVariant[row.original.ConsultationTicketAttribute?.status as keyof typeof badgeVariant]}>{row.original.ConsultationTicketAttribute?.status}</Badge>
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
            <ConsultationTicketTableRowActions consultation={row.original} />
          </DropdownMenuProvider>
        )
      )
    }
  },
]


export const Requester = ({ requester }: {
  requester: {
    id: number
    firstName: string | null
    middleName: string | null
    lastName: string | null
    suffix: string | null
  }
}) => {
  const requesterName = `${requester.firstName ?? ""} ${requester.middleName ?? ""} ${requester.lastName ?? ""} ${requester.suffix ?? ""}`
  return (
    <div className="text-wrap">{requesterName}</div>
  )
}