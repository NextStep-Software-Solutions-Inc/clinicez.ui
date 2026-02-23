"use client";

import { useState, useCallback } from "react";
import {
  Calendar,
  Stethoscope,
  Clock,
  CheckCircle2,
  Archive,
  ChevronLeft,
  ClipboardList,
  FileText,
  Pill,
  TestTube,
  Scan,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "@/lib/day-utils";
import type { GetPatientHistoryResult } from "@/actions/clinics/get-patient-history.action";
import type { PatientHistoryAccess } from "@/actions/clinics/get-patient-history.action";

type HistoryData = NonNullable<GetPatientHistoryResult["data"]>;
type Appointment = HistoryData["appointments"][number];
type ConsultationTicket = HistoryData["consultationTickets"][number];

interface PatientAppointmentsConsultationsClientProps {
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
// Sub-components
// ---------------------------------------------------------------------------

function ConsultationDetail({
  ticket,
  access,
}: {
  ticket: ConsultationTicket;
  access: PatientHistoryAccess;
}) {
  const appointment = ticket.Appointment;
  const hps = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider);

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant={getConsultationStatusVariant(
              ticket.ConsultationTicketAttribute?.status
            )}
            className="gap-1 text-xs"
          >
            {getConsultationStatusIcon(ticket.ConsultationTicketAttribute?.status)}
            {ticket.ConsultationTicketAttribute?.status ?? "Open"}
          </Badge>
          {ticket.isArchived && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Archive className="h-3.5 w-3.5" />
              Archived
            </Badge>
          )}
          {ticket.caseNumber && (
            <span className="text-xs text-muted-foreground">
              Case #{ticket.caseNumber}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-foreground mt-2">
          {ticket.subject ?? "Consultation"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dayjs(ticket.createdAt).format("MMMM D, YYYY [at] h:mm A")}
        </p>
      </div>

      {/* Healthcare Providers */}
      {hps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Consulting Providers
          </p>
          <div className="flex flex-col gap-1.5">
            {hps.map((hp) => (
              <div key={hp.id} className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {[
                    hp.HPProfile?.title,
                    hp.HPProfile?.name ||
                      `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim(),
                    hp.HPProfile?.suffix,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {hp.HPType?.name && (
                    <span className="text-muted-foreground ml-1.5">
                      · {hp.HPType.name}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Appointment */}
      {appointment && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Linked Appointment
          </p>
          <p className="text-sm font-medium text-foreground">
            {appointment.subject ?? appointment.complaint ?? "Appointment"}
          </p>
          {appointment.AppointmentAttribute && (
            <div className="flex flex-wrap gap-2 mt-2">
              {appointment.AppointmentAttribute.date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {dayjs(appointment.AppointmentAttribute.date).format("MMM D, YYYY")}
                </span>
              )}
              {appointment.AppointmentAttribute.AppointmentType?.name && (
                <Badge variant="outline" className="text-xs">
                  {appointment.AppointmentAttribute.AppointmentType.name}
                </Badge>
              )}
              {appointment.AppointmentAttribute.AppointmentMode?.name && (
                <Badge variant="outline" className="text-xs">
                  {appointment.AppointmentAttribute.AppointmentMode.name}
                </Badge>
              )}
              {appointment.AppointmentAttribute.Service?.name && (
                <Badge variant="outline" className="text-xs">
                  {appointment.AppointmentAttribute.Service.name}
                </Badge>
              )}
              <Badge
                variant={getAppointmentStatusVariant(
                  appointment.AppointmentAttribute.status
                )}
                className="text-xs"
              >
                {appointment.AppointmentAttribute.status}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Consultation Notes */}
      {ticket.ConsultationNotes.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Consultation Notes
          </p>
          <div className="flex flex-col gap-3">
            {ticket.ConsultationNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border/60 bg-background p-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {note.section}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {access === "owner"
              ? "No notes have been shared with you for this consultation."
              : "No consultation notes recorded."}
          </p>
        </div>
      )}

      {/* Attachments summary (counts only) */}
      {(ticket.Prescriptions.length > 0 ||
        ticket.MedicalCertificates.length > 0 ||
        ticket.LaboratoryRequests.length > 0 ||
        ticket.ImagingRequests.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {ticket.Prescriptions.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1">
                <Pill className="h-3.5 w-3.5 text-emerald-500" />
                {ticket.Prescriptions.length} Prescription
                {ticket.Prescriptions.length !== 1 ? "s" : ""}
              </span>
            )}
            {ticket.MedicalCertificates.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1">
                <FileCheck className="h-3.5 w-3.5 text-blue-500" />
                {ticket.MedicalCertificates.length} Certificate
                {ticket.MedicalCertificates.length !== 1 ? "s" : ""}
              </span>
            )}
            {ticket.LaboratoryRequests.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1">
                <TestTube className="h-3.5 w-3.5 text-purple-500" />
                {ticket.LaboratoryRequests.length} Lab Request
                {ticket.LaboratoryRequests.length !== 1 ? "s" : ""}
              </span>
            )}
            {ticket.ImagingRequests.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1">
                <Scan className="h-3.5 w-3.5 text-orange-500" />
                {ticket.ImagingRequests.length} Imaging Request
                {ticket.ImagingRequests.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentDetail({ appointment }: { appointment: Appointment }) {
  const attr = appointment.AppointmentAttribute;
  const hp = appointment.AppointmentRouting[0]?.RoutedTo;

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        {attr && (
          <Badge
            variant={getAppointmentStatusVariant(attr.status)}
            className="text-xs mb-1"
          >
            {attr.status}
          </Badge>
        )}
        <h2 className="text-lg font-semibold text-foreground mt-2">
          {appointment.subject ?? appointment.complaint ?? "Appointment"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dayjs(appointment.createdAt).format("MMMM D, YYYY [at] h:mm A")}
        </p>
      </div>

      {/* Appointment Details */}
      {attr && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Details
          </p>
          <div className="flex flex-col gap-2.5">
            {attr.date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {dayjs(attr.date).format("MMMM D, YYYY")}
                  {attr.timeStart && ` · ${attr.timeStart}`}
                  {attr.timeEnd && ` – ${attr.timeEnd}`}
                </span>
              </div>
            )}
            {attr.AppointmentType?.name && (
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{attr.AppointmentType.name}</span>
              </div>
            )}
            {attr.AppointmentMode?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{attr.AppointmentMode.name}</span>
              </div>
            )}
            {attr.Service?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{attr.Service.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Provider */}
      {hp && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Assigned Provider
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {[
                hp.HPProfile?.title,
                hp.HPProfile?.name ||
                  `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim(),
                hp.HPProfile?.suffix,
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        </div>
      )}

      {/* Complaint */}
      {appointment.complaint && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Chief Complaint
          </p>
          <p className="text-sm text-foreground">{appointment.complaint}</p>
        </div>
      )}

      {/* No consultation note yet */}
      {appointment.ConsultationTickets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center rounded-lg border border-dashed border-border/60">
          <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No consultation notes have been recorded for this appointment.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PatientAppointmentsConsultationsClient({
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

  const [selectedKey, setSelectedKey] = useState<string | null>(
    listItems[0] ? `${listItems[0].kind}-${listItems[0].data.id}` : null
  );
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const selectedItem = listItems.find(
    (item) => `${item.kind}-${item.data.id}` === selectedKey
  );

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key);
    setMobileView("detail");
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-16rem)] overflow-hidden">
      {/* Mobile: back button when viewing detail */}
      {mobileView === "detail" && (
        <div className="md:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/80 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: List */}
        <aside
          className={`shrink-0 flex-col border-r border-border/50 bg-background/60 overflow-hidden w-full md:w-80 ${
            mobileView === "detail" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border/50 shrink-0">
            <p className="text-sm font-semibold text-foreground">{patientName}</p>
            <p className="text-xs text-muted-foreground">
              {consultationTickets.length} consultation
              {consultationTickets.length !== 1 ? "s" : ""} ·{" "}
              {appointments.length} appointment
              {appointments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-muted-foreground/50" />
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
              listItems.map((item) => {
                const key = `${item.kind}-${item.data.id}`;
                const isSelected = selectedKey === key;

                if (item.kind === "consultation") {
                  const ticket = item.data as ConsultationTicket;
                  const status = ticket.ConsultationTicketAttribute?.status;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelect(key)}
                      className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/40 ${
                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
                        </p>
                        <Badge
                          variant={getConsultationStatusVariant(status)}
                          className="text-xs shrink-0 gap-1"
                        >
                          {getConsultationStatusIcon(status)}
                          {status ?? "Open"}
                        </Badge>
                      </div>
                      {ticket.caseNumber && (
                        <p className="text-xs text-muted-foreground">
                          Case #{ticket.caseNumber}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dayjs(ticket.createdAt).format("MMM D, YYYY")}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {ticket.ConsultationNotes.length}
                        </span>
                        {ticket.Prescriptions.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Pill className="h-3 w-3" />
                            {ticket.Prescriptions.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                }

                const appt = item.data as Appointment;
                const aptStatus = appt.AppointmentAttribute?.status;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/40 ${
                      isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      </p>
                      {aptStatus && (
                        <Badge
                          variant={getAppointmentStatusVariant(aptStatus)}
                          className="text-xs shrink-0"
                        >
                          {aptStatus}
                        </Badge>
                      )}
                    </div>
                    {appt.AppointmentAttribute?.date && (
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {dayjs(appt.AppointmentAttribute.date).format(
                          "MMM D, YYYY"
                        )}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {appt.AppointmentAttribute?.AppointmentType?.name ??
                        "Appointment"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Detail */}
        <main
          className={`flex-1 overflow-hidden ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedItem ? (
            selectedItem.kind === "consultation" ? (
              <ConsultationDetail
                ticket={selectedItem.data as ConsultationTicket}
                access={access}
              />
            ) : (
              <AppointmentDetail appointment={selectedItem.data as Appointment} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select an item from the list to view details.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
