"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import {
  Stethoscope,
  Search,
  Clock,
  CheckCircle2,
  Archive,
  User,
  CalendarDays,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import type { GetClinicConsultationQueue } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import {
  getPatientConsultationDetailAction,
  getClinicConsultationQueueAction,
} from "@/actions/consultation/patient-consultations.action";
import ConsultationWorkspace from "./ConsultationWorkspace";

type QueueItem = NonNullable<GetClinicConsultationQueue["data"]>[number];
type ConsultationDetail = NonNullable<
  Awaited<ReturnType<typeof getPatientConsultationDetailAction>>["data"]
>;

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
  dob: string | null;
  gender: string | null;
}

function buildPatientInfo(item: QueueItem): PatientInfo | null {
  const requester = item.Appointment?.Requesters?.[0]?.User;
  if (!requester) return null;
  const clinicPatientId = requester.ClinicPatients?.[0]?.id;
  if (!clinicPatientId) return null;
  const fullName = [
    requester.firstName,
    requester.middleName,
    requester.lastName,
    requester.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: requester.id,
    clinicPatientId,
    userId: requester.userId,
    fullName: fullName || `Patient #${requester.id}`,
    dob: requester.dob ? requester.dob.toISOString() : null,
    gender: requester.gender,
  };
}

type StatusFilter = "all" | "PROCESSING" | "RESOLVED";

interface ClinicConsultationsClientProps {
  clinicUid: string;
  initialQueue: NonNullable<GetClinicConsultationQueue["data"]>;
  myHPs: NonNullable<GetHPsType>;
}

export default function ClinicConsultationsClient({
  clinicUid,
  initialQueue,
  myHPs,
}: ClinicConsultationsClientProps) {
  const [queue, setQueue] = useState<NonNullable<GetClinicConsultationQueue["data"]>>(initialQueue);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<ConsultationDetail | null>(null);
  const [activePatient, setActivePatient] = useState<PatientInfo | null>(null);
  const [loadingDetail, startDetailTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hpOnly, setHpOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshingQueue, startQueueTransition] = useTransition();
  const initialLoadDone = useRef(false);

  /* ── Load detail ── */
  const loadDetail = useCallback(
    (item: QueueItem) => {
      const patient = buildPatientInfo(item);
      setSelectedId(item.id);
      setActivePatient(patient);
      startDetailTransition(async () => {
        const result = await getPatientConsultationDetailAction({
          clinicUid,
          ticketId: item.id,
        });
        if (result.status && result.data) {
          setActiveDetail(result.data);
        } else {
          toast.error(result.message ?? "Failed to load consultation");
        }
      });
    },
    [clinicUid]
  );

  /* ── Auto-load first item on mount ── */
  useEffect(() => {
    if (!initialLoadDone.current && initialQueue[0]) {
      initialLoadDone.current = true;
      loadDetail(initialQueue[0]);
    }
  }, [initialQueue, loadDetail]);

  /* ── Refresh queue when filters change ── */
  useEffect(() => {
    startQueueTransition(async () => {
      const result = await getClinicConsultationQueueAction({
        clinicUid,
        status: statusFilter === "all" ? undefined : statusFilter,
        hpOnly,
      });
      if (result.status && result.data) {
        setQueue(result.data);
      }
    });
  }, [clinicUid, statusFilter, hpOnly]);

  const refreshDetail = useCallback(() => {
    if (selectedId) {
      const item = queue.find((q) => q.id === selectedId);
      if (item) loadDetail(item);
    }
  }, [selectedId, queue, loadDetail]);

  /* ── Filter queue items by search ── */
  const filteredQueue = queue.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const patientName = (() => {
      const u = item.Appointment?.Requesters?.[0]?.User;
      if (!u) return "";
      return `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
    })();
    const subject = (item.subject ?? item.Appointment?.subject ?? "").toLowerCase();
    const caseNum = (item.caseNumber ?? "").toLowerCase();
    return patientName.includes(q) || subject.includes(q) || caseNum.includes(q);
  });

  return (
    <div className="flex h-[calc(100dvh-11rem)] gap-0 overflow-hidden">
      {/* ── Left Panel: Queue ── */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-border/50 bg-background/60 overflow-hidden">
        {/* Filters */}
        <div className="shrink-0 px-3 py-3 border-b border-border/50 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search patient, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-1">
              {(["all", "PROCESSING", "RESOLVED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`flex-1 text-[10px] font-medium py-1 rounded-md transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "all" ? "All" : s === "PROCESSING" ? "Active" : "Resolved"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHpOnly((v) => !v)}
              className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors shrink-0 ${
                hpOnly
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Mine
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {refreshingQueue ? "Loading…" : `${filteredQueue.length} consultation${filteredQueue.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No consultations found</p>
            </div>
          ) : (
            filteredQueue.map((item) => (
              <QueueListItem
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onClick={() => loadDetail(item)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right Panel: Workspace ── */}
      <main className="flex-1 overflow-hidden">
        {loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading consultation…</p>
            </div>
          </div>
        ) : activeDetail && activePatient ? (
          <ConsultationWorkspace
            clinicUid={clinicUid}
            patient={activePatient}
            consultation={activeDetail}
            myHPs={myHPs}
            onRefresh={refreshDetail}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground/70">Consultation Queue</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a consultation from the list to open the workspace
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Queue List Item ── */
function QueueListItem({
  item,
  isSelected,
  onClick,
}: {
  item: QueueItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = item.ConsultationTicketAttribute?.status;
  const requester = item.Appointment?.Requesters?.[0]?.User;
  const patientName = requester
    ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim()
    : null;

  const primaryHP = item.ConsultationTicketHPs[0]?.HealthCareProvider;
  const hpName = primaryHP?.HPProfile?.name
    ? `${primaryHP.HPProfile.title ?? ""} ${primaryHP.HPProfile.name}`.trim()
    : `${primaryHP?.User?.firstName ?? ""} ${primaryHP?.User?.lastName ?? ""}`.trim();

  const docCount =
    (item.Prescriptions?.length ?? 0) +
    (item.MedicalCertificates?.length ?? 0) +
    (item.LaboratoryRequests?.length ?? 0) +
    (item.ImagingRequests?.length ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Patient name */}
          {patientName && (
            <div className="flex items-center gap-1 mb-0.5">
              <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <p className="text-xs font-semibold text-foreground truncate">{patientName}</p>
            </div>
          )}
          {/* Subject / complaint */}
          <p className="text-xs text-muted-foreground truncate">
            {item.subject || item.Appointment?.subject || item.Appointment?.complaint || `Ticket #${item.id}`}
          </p>
          {/* Date + HP */}
          <div className="flex items-center gap-2 mt-1">
            {item.Appointment?.AppointmentAttribute?.date && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                <CalendarDays className="h-2.5 w-2.5" />
                {dayjs(item.Appointment.AppointmentAttribute.date).format("MMM D")}
              </span>
            )}
            {hpName && (
              <span className="text-[10px] text-muted-foreground/70 truncate">{hpName}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              status === "RESOLVED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {status === "RESOLVED" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status === "RESOLVED" ? "Done" : "Active"}
          </div>
          {item.isArchived && <Archive className="h-3 w-3 text-muted-foreground/50" />}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-1.5">
        {(item.ConsultationNotes?.length ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {item.ConsultationNotes.length} note{item.ConsultationNotes.length !== 1 ? "s" : ""}
          </span>
        )}
        {docCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {docCount} doc{docCount !== 1 ? "s" : ""}
          </span>
        )}
        {item.Appointment?.AppointmentAttribute?.Service?.name && (
          <span className="text-[10px] text-muted-foreground/60 truncate">
            {item.Appointment.AppointmentAttribute.Service.name}
          </span>
        )}
      </div>
    </button>
  );
}
