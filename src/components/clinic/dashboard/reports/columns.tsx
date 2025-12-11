"use client"

import { GetConsultationTickets } from "@/actions/consultation/consultation-ticket.action"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Badge, BadgeProps } from "@components/ui/badge"
import Link from "next/link"
import dayjs from "@lib/day-utils"
import { calculateAge } from "@/lib/utils"

type ConsultationTicketData = NonNullable<GetConsultationTickets["data"]>[number]

// Reusable mapping from appointment status to badge variant
export const APPOINTMENT_STATUS_BADGE_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDING: "destructive",
  ACCEPTED: "default",
  COMPLETED: "secondary",
  REJECTED: "outline",
} as const

export const columns: ColumnDef<ConsultationTicketData>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      return (
        <Link
          className="text-primary font-medium hover:underline"
          href={{
            pathname: `consultations/${row.original.id}`
          }}
        >
          Ticket #{row.original.id}
        </Link>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt
      return (
        <div className="text-sm">
          {dayjs(date).format("MMM DD, YYYY")}
        </div>
      )
    }
  },
  {
    accessorKey: "patient",
    accessorFn: (row) => {
      const patient = row.Appointment?.Requesters[0]?.User
      const nameParts = [
        patient?.firstName,
        patient?.middleName,
        patient?.lastName,
        patient?.suffix
      ].filter(Boolean)
      return nameParts.join(" ")
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      const patient = row.original.Appointment?.Requesters[0]?.User
      if (!patient) return <span className="text-muted-foreground">-</span>

      const nameParts = [
        patient.firstName,
        patient.middleName,
        patient.lastName,
        patient.suffix
      ].filter(Boolean)
      const patientName = nameParts.join(" ")

      return (
        <div className="text-wrap">
          <div className="font-medium">{patientName}</div>
        </div>
      )
    }
  },
  {
    accessorKey: "age",
    accessorFn: (row) => {
      const patient = row.Appointment?.Requesters[0]?.User
      return patient?.dob ? calculateAge(patient.dob) : null
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Age" />
    ),
    cell: ({ row }) => {
      const patient = row.original.Appointment?.Requesters[0]?.User
      const age = calculateAge(patient?.dob)
      
      return age === null ? (
        <span className="text-muted-foreground">-</span>
      ) : (
        <div className="text-sm">{age}</div>
      )
    }
  },
  {
    accessorKey: "gender",
    accessorFn: (row) => row.Appointment?.Requesters[0]?.User?.gender,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sex" />
    ),
    cell: ({ row }) => {
      const gender = row.original.Appointment?.Requesters[0]?.User?.gender
      return (
        <div className="text-sm">
          {gender || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "serviceCategory",
    accessorFn: (row) => row.Appointment?.AppointmentAttribute?.Service?.ServiceCategory?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service Category" />
    ),
    cell: ({ row }) => {
      const category = row.original.Appointment?.AppointmentAttribute?.Service?.ServiceCategory?.name
      return (
        <Badge variant="outline">
          {category || "-"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "service",
    accessorFn: (row) => row.Appointment?.AppointmentAttribute?.Service?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service" />
    ),
    cell: ({ row }) => {
      const service = row.original.Appointment?.AppointmentAttribute?.Service?.name
      return (
        <div className="text-sm">
          {service || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "appointmentStatus",
    accessorFn: (row) => row.Appointment?.AppointmentAttribute?.status,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.Appointment?.AppointmentAttribute?.status
      if (!status) return <span className="text-muted-foreground">-</span>

      return (
        <Badge variant={APPOINTMENT_STATUS_BADGE_VARIANT[status as keyof typeof APPOINTMENT_STATUS_BADGE_VARIANT] || "outline"}>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "program",
    accessorFn: (row) => row.Appointment?.Requesters[0]?.User?.StudentRecords?.[0]?.Program?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Program" />
    ),
    cell: ({ row }) => {
      const program = row.original.Appointment?.Requesters[0]?.User?.StudentRecords?.[0]?.Program?.name
      return (
        <div className="text-sm">
          {program || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "appointmentMode",
    accessorFn: (row) => row.Appointment?.AppointmentAttribute?.AppointmentMode?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Appointment Type" />
    ),
    cell: ({ row }) => {
      const mode = row.original.Appointment?.AppointmentAttribute?.AppointmentMode?.name
      return (
        <Badge variant="secondary">
          {mode || "-"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "appointmentType",
    accessorFn: (row) => row.Appointment?.AppointmentAttribute?.AppointmentType?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Consultation Type" />
    ),
    cell: ({ row }) => {
      const type = row.original.Appointment?.AppointmentAttribute?.AppointmentType?.name
      return (
        <div className="text-sm">
          {type || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "complaint",
    accessorFn: (row) => row.Appointment?.complaint || row.subject,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purpose/Chief Complaint" />
    ),
    cell: ({ row }) => {
      const complaint = row.original.Appointment?.complaint || row.original.subject
      return (
        <div className="max-w-[300px] truncate text-sm">
          {complaint || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "taggedDoctor",
    accessorFn: (row) => {
      const hp = row.ConsultationTicketHPs?.[0]?.HealthCareProvider
      const nameParts = [hp?.User?.firstName, hp?.User?.lastName].filter(Boolean)
      return hp?.HPProfile?.name || nameParts.join(" ")
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tagged Doctor" />
    ),
    cell: ({ row }) => {
      const hp = row.original.ConsultationTicketHPs?.[0]?.HealthCareProvider
      const nameParts = [hp?.User?.firstName, hp?.User?.lastName].filter(Boolean)
      const doctorName = hp?.HPProfile?.name || nameParts.join(" ")
      return (
        <div className="text-sm">
          {doctorName || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "taggedHPs",
    accessorFn: (row) => {
      const tags = row.Appointment?.AppointmentTags ?? [];
      return tags.map((tag) => {
        const hp = tag.HealthcareProvider;
        const nameParts = [hp?.User?.firstName, hp?.User?.lastName].filter(Boolean);
        return hp?.HPProfile?.name || nameParts.join(" ");
      }).join(", ");
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tagged HPs (Info Only)" />
    ),
    cell: ({ row }) => {
      const tags = row.original.Appointment?.AppointmentTags ?? [];
      if (tags.length === 0) {
        return <span className="text-muted-foreground text-xs">-</span>;
      }
      return (
        <div className="max-w-[250px] space-y-1">
          {tags.map((tag) => {
            const hp = tag.HealthcareProvider;
            const nameParts = [hp?.User?.firstName, hp?.User?.lastName].filter(Boolean);
            const hpName = hp?.HPProfile?.name || nameParts.join(" ");
            const role = hp?.HPType?.name;
            const specialties = hp?.HPProfile?.specialties || [];
            
            return (
              <div key={tag.id} className="text-xs">
                <div className="font-medium">{hpName}</div>
                <div className="text-muted-foreground text-[0.65rem]">
                  {role}
                  {specialties.length > 0 && ` • ${specialties.join(", ")}`}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  },
  {
    accessorKey: "system",
    accessorFn: (row) => row.System.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="System" />
    ),
    cell: ({ row }) => {
      return (
        <Badge>
          {row.original.System.name}
        </Badge>
      )
    }
  }
]