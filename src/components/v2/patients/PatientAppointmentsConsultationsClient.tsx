"use client";

import Link from "next/link";
import {
  Calendar,
  Stethoscope,
  Clock,
  CheckCircle2,
  Archive,
  ChevronRight,
  ClipboardList,
  FileText,
  Pill,
  TestTube,
  Scan,
  FileCheck,
  AlertCircle,
  Clipboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/day-utils";
import type { GetPatientHistoryResult } from "@/actions/clinics/get-patient-history.action";
import type { PatientHistoryAccess } from "@/actions/clinics/get-patient-history.action";

type HistoryData = NonNullable<GetPatientHistoryResult["data"]>;
type Appointment = HistoryData["appointments"][number];
type ConsultationTicket = HistoryData["consultationTickets"][number];

interface PatientAppointmentsConsultationsClientProps {
  clinicUid: string;
  patientId: number;
  patientName: string;
  appointments: HistoryData["appointments"];
  consultationTickets: HistoryData["consultationTickets"];
  access: PatientHistoryAccess;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getConsultationStatusVariant(
  status?: string | null
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "RESOLVED":
      return "default";
    case "PROCESSING":
      return "secondary";
    default:
      return "outline";
  }
}

function getConsultationStatusIcon(status?: string | null) {
  switch (status) {
    case "RESOLVED":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "PROCESSING":
      return <Clock className="h-3.5 w-3.5" />;
    case "ARCHIVED":
      return <Archive className="h-3.5 w-3.5" />;
    default:
      return <Stethoscope className="h-3.5 w-3.5" />;
  }
}

function getAppointmentStatusVariant(
  status?: string | null
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "default";
    case "PENDING":
    case "ROUTED":
    case "RECEIVED":
      return "secondary";
    case "CANCELLED":
    case "DECLINED":
      return "destructive";
    default:
      return "outline";
  }
}

// ---------------------------------------------------------------------------
// Unified list item type
// ---------------------------------------------------------------------------

type ListItem =
  | { kind: "consultation"; data: ConsultationTicket; date: Date }
  | { kind: "appointment"; data: Appointment; date: Date };

// ---------------------------------------------------------------------------
// Timeline entry components
// ---------------------------------------------------------------------------

function ConsultationTimelineEntry({
  ticket,
  access,
  isLast,
}: {
  ticket: ConsultationTicket;
  access: PatientHistoryAccess;
  isLast: boolean;
}) {
  const status = ticket.ConsultationTicketAttribute?.status;
  const hps = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider);
  const appointment = ticket.Appointment;

  // Build lookup maps: by section name AND by numeric ID (section field stores either)
  const sections = ticket.ConsultationTicketAttribute?.NoteTemplate?.NoteSections ?? [];
  const sectionLabelByName = new Map<string, string>(
    sections.map((s) => [s.name, s.label || s.name])
  );
  const sectionLabelById = new Map<number, string>(
    sections.map((s) => [s.id, s.label || s.name])
  );
  const getSectionLabel = (sectionValue: string) => {
    // Try lookup by name first
    const byName = sectionLabelByName.get(sectionValue);
    if (byName) return byName;
    // Try lookup by numeric ID (some older records store the NoteSection.id as a string)
    const numericId = parseInt(sectionValue, 10);
    if (!isNaN(numericId)) {
      const byId = sectionLabelById.get(numericId);
      if (byId) return byId;
    }
    // Fallback: capitalize and de-slugify
    return sectionValue.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center shrink-0 w-6">
        <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-background mt-1.5 shrink-0 z-10" />
        {!isLast && (
          <div className="w-0.5 bg-border/50 flex-1 mt-1" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden p-3 sm:p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Consultation
                </span>
                {ticket.caseNumber && (
                  <span className="text-xs text-muted-foreground">
                    · Case #{ticket.caseNumber}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground truncate">
                {ticket.subject ?? "Consultation"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dayjs(ticket.createdAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant={getConsultationStatusVariant(status)}
                className="gap-1 text-xs"
              >
                {getConsultationStatusIcon(status)}
                {status ?? "Open"}
              </Badge>
              {ticket.isArchived && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Archive className="h-3 w-3" />
                  Archived
                </Badge>
              )}
            </div>
          </div>

          {/* Healthcare providers */}
          {hps.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {hps.map((hp) => (
                <span
                  key={hp.id}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Stethoscope className="h-3 w-3 shrink-0" />
                  {[
                    hp.HPProfile?.title,
                    hp.HPProfile?.name ||
                      `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim(),
                    hp.HPProfile?.suffix,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {hp.HPType?.name && (
                    <span className="text-muted-foreground/60">
                      · {hp.HPType.name}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Linked appointment chip */}
          {appointment && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 max-w-full overflow-hidden">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Linked: {appointment.subject ?? appointment.complaint ?? "Appointment"}
              </span>
              {appointment.AppointmentAttribute?.date && (
                <span className="text-muted-foreground/70 shrink-0">
                  · {dayjs(appointment.AppointmentAttribute.date).format("MMM D, YYYY")}
                </span>
              )}
            </div>
          )}

          {/* Consultation notes */}
          {ticket.ConsultationNotes.length > 0 ? (
            <div className="space-y-2 mb-3">
              {ticket.ConsultationNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md bg-muted/40 border border-border/40 p-3"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    {getSectionLabel(note.section)}
                  </p>
                  <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words line-clamp-4">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground/60">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>
                {access === "owner"
                  ? "No notes shared with you."
                  : "No consultation notes recorded."}
              </span>
            </div>
          )}

          {/* Attachments summary */}
          {(ticket.Prescriptions.length > 0 ||
            ticket.MedicalCertificates.length > 0 ||
            ticket.LaboratoryRequests.length > 0 ||
            ticket.ImagingRequests.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
              {ticket.Prescriptions.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                  <Pill className="h-3 w-3 text-emerald-500" />
                  {ticket.Prescriptions.length} Rx
                </span>
              )}
              {ticket.MedicalCertificates.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                  <FileCheck className="h-3 w-3 text-blue-500" />
                  {ticket.MedicalCertificates.length} Cert
                </span>
              )}
              {ticket.LaboratoryRequests.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                  <TestTube className="h-3 w-3 text-purple-500" />
                  {ticket.LaboratoryRequests.length} Lab
                </span>
              )}
              {ticket.ImagingRequests.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                  <Scan className="h-3 w-3 text-orange-500" />
                  {ticket.ImagingRequests.length} Imaging
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentTimelineEntry({
  appointment,
  isLast,
}: {
  appointment: Appointment;
  isLast: boolean;
}) {
  const attr = appointment.AppointmentAttribute;
  const hp = appointment.AppointmentRouting[0]?.RoutedTo;

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center shrink-0 w-6">
        <div className="w-3 h-3 rounded-full bg-background border-2 border-muted-foreground/40 mt-1.5 shrink-0 z-10" />
        {!isLast && (
          <div className="w-0.5 bg-border/50 flex-1 mt-1" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden p-3 sm:p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Appointment
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground truncate">
                {appointment.subject ?? appointment.complaint ?? "Appointment"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {attr?.date
                  ? dayjs(attr.date).format("MMMM D, YYYY") +
                    (attr.timeStart ? ` at ${attr.timeStart}` : "") +
                    (attr.timeEnd ? ` – ${attr.timeEnd}` : "")
                  : dayjs(appointment.createdAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            {attr?.status && (
              <Badge
                variant={getAppointmentStatusVariant(attr.status)}
                className="text-xs shrink-0"
              >
                {attr.status}
              </Badge>
            )}
          </div>

          {/* Type / Mode / Service badges */}
          {attr && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {attr.AppointmentType?.name && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ClipboardList className="h-3 w-3" />
                  {attr.AppointmentType.name}
                </Badge>
              )}
              {attr.AppointmentMode?.name && (
                <Badge variant="outline" className="text-xs">
                  {attr.AppointmentMode.name}
                </Badge>
              )}
              {attr.Service?.name && (
                <Badge variant="outline" className="text-xs">
                  {attr.Service.name}
                </Badge>
              )}
            </div>
          )}

          {/* Assigned provider */}
          {hp && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              {[
                hp.HPProfile?.title,
                hp.HPProfile?.name ||
                  `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim(),
                hp.HPProfile?.suffix,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}

          {/* Chief complaint */}
          {appointment.complaint && (
            <div className="rounded-md bg-muted/40 border border-border/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Chief Complaint
              </p>
              <p className="text-xs text-foreground/80">{appointment.complaint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PatientAppointmentsConsultationsClient({
  clinicUid,
  patientId,
  patientName,
  appointments,
  consultationTickets,
  access,
}: PatientAppointmentsConsultationsClientProps) {
  // Build a unified, sorted list
  const listItems: ListItem[] = [
    ...consultationTickets.map(
      (t): ListItem => ({
        kind: "consultation",
        data: t,
        date: new Date(t.createdAt),
      })
    ),
    // Only show appointments that have NO consultation ticket (avoid duplicates)
    ...appointments
      .filter((a) => a.ConsultationTickets.length === 0)
      .map(
        (a): ListItem => ({
          kind: "appointment",
          data: a,
          date: a.AppointmentAttribute?.date
            ? new Date(a.AppointmentAttribute.date)
            : new Date(a.createdAt),
        })
      ),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
      {/* Sub-header: summary + navigation button */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <p className="text-xs text-muted-foreground">
          {patientName} · {consultationTickets.length} consultation
          {consultationTickets.length !== 1 ? "s" : ""} ·{" "}
          {appointments.length} appointment
          {appointments.length !== 1 ? "s" : ""}
        </p>
        <Link
          href={`/v2/clinic/${clinicUid}/patients/${patientId}/consultations`}
        >
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Clipboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Consultations Workspace</span>
            <span className="sm:hidden">Workspace</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Timeline */}
      {listItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/70">
              No history yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Appointments and consultation notes will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {listItems.map((item, index) =>
            item.kind === "consultation" ? (
              <ConsultationTimelineEntry
                key={`consultation-${item.data.id}`}
                ticket={item.data as ConsultationTicket}
                access={access}
                isLast={index === listItems.length - 1}
              />
            ) : (
              <AppointmentTimelineEntry
                key={`appointment-${item.data.id}`}
                appointment={item.data as Appointment}
                isLast={index === listItems.length - 1}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
