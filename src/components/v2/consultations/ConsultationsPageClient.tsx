"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { ClipboardPlus, Stethoscope, Clock, CheckCircle2, Archive, ChevronLeft, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import type { GetPatientConsultations } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import type { GetSystems } from "@/actions/system.action";
import { getPatientConsultationDetailAction } from "@/actions/consultation/patient-consultations.action";
import ConsultationWorkspace from "./ConsultationWorkspace";
import NewConsultationDialog from "./NewConsultationDialog";

type Consultation = NonNullable<GetPatientConsultations["data"]>[number];
type ConsultationDetail = NonNullable<Awaited<ReturnType<typeof getPatientConsultationDetailAction>>["data"]>;

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
  dob: string | null;
  gender: string | null;
}

interface ConsultationsPageClientProps {
  clinicUid: string;
  patient: PatientInfo;
  initialConsultations: NonNullable<GetPatientConsultations["data"]>;
  myHPs: NonNullable<GetHPsType>;
  systems: NonNullable<GetSystems>;
}

function getStatusVariant(status?: string | null): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "RESOLVED": return "default";
    case "PROCESSING": return "secondary";
    case "DROPPED": return "outline";
    default: return "outline";
  }
}

function getStatusIcon(status?: string | null) {
  switch (status) {
    case "RESOLVED": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "PROCESSING": return <Clock className="h-3.5 w-3.5" />;
    case "DROPPED": return <Ban className="h-3.5 w-3.5" />;
    default: return <Stethoscope className="h-3.5 w-3.5" />;
  }
}

export default function ConsultationsPageClient({
  clinicUid,
  patient,
  initialConsultations,
  myHPs,
  systems,
}: ConsultationsPageClientProps) {
  const [consultations, setConsultations] = useState<NonNullable<GetPatientConsultations["data"]>>(initialConsultations);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialConsultations[0]?.id ?? null
  );
  const [activeDetail, setActiveDetail] = useState<ConsultationDetail | null>(null);
  const [loadingDetail, startDetailTransition] = useTransition();
  /** Mobile view: show the list panel or the workspace panel */
  const [mobileView, setMobileView] = useState<"list" | "workspace">("list");

  const loadDetail = useCallback(
    (ticketId: number) => {
      setSelectedId(ticketId);
      startDetailTransition(async () => {
        const result = await getPatientConsultationDetailAction({ clinicUid, ticketId });
        if (result.status && result.data) {
          setActiveDetail(result.data);
        } else {
          toast.error(result.message ?? "Failed to load consultation");
        }
      });
    },
    [clinicUid]
  );

  // Auto-load first consultation on mount
  useEffect(() => {
    if (initialConsultations[0]?.id) {
      loadDetail(initialConsultations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (newTicket: Consultation) => {
    setConsultations((prev) => [newTicket, ...prev]);
    loadDetail(newTicket.id);
    setMobileView("workspace");
  };

  /** User-initiated selection: load detail and switch to workspace on mobile */
  const handleSelect = useCallback(
    (id: number) => {
      loadDetail(id);
      setMobileView("workspace"); // setMobileView is a stable useState setter — no dep needed
    },
    [loadDetail]
  );

  const handlePatchDetail = useCallback((patch: Partial<ConsultationDetail>) => {
    setActiveDetail((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleReloadDetail = useCallback(() => {
    if (!selectedId) return;
    startDetailTransition(async () => {
      const result = await getPatientConsultationDetailAction({ clinicUid, ticketId: selectedId });
      if (result.status && result.data) {
        setActiveDetail(result.data);
      }
    });
  }, [clinicUid, selectedId]);

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] sm:h-[calc(100dvh-11.5rem)] overflow-hidden">
      {/* ── Mobile back button (workspace → list) ── */}
      {mobileView === "workspace" && (
        <div className="md:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/80 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Consultations
          </button>
        </div>
      )}

      {/* ── Split panel row ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* ── Left Panel: Consultation List ── */}
        <aside
          className={`shrink-0 flex-col border-r border-border/50 bg-background/60 overflow-hidden w-full md:w-80 ${
            mobileView === "workspace" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
            <div>
              <p className="text-sm font-semibold text-foreground">{patient.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {consultations.length} consultation{consultations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <NewConsultationDialog
              clinicUid={clinicUid}
              patient={patient}
              myHPs={myHPs}
              systems={systems}
              onCreated={handleCreated}
            >
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <ClipboardPlus className="h-3.5 w-3.5" />
                New
              </Button>
            </NewConsultationDialog>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {consultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70">No consultations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click <strong>New</strong> to start a consultation
                  </p>
                </div>
              </div>
            ) : (
              consultations.map((c) => (
                <ConsultationListItem
                  key={c.id}
                  consultation={c}
                  isSelected={selectedId === c.id}
                  onClick={() => handleSelect(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Right Panel: Workspace ── */}
        <main
          className={`flex-1 overflow-hidden ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeDetail ? (
            <ConsultationWorkspace
              key={activeDetail.id}
              clinicUid={clinicUid}
              patient={patient}
              consultation={activeDetail}
              myHPs={myHPs}
              onPatchDetail={handlePatchDetail}
              onReloadDetail={handleReloadDetail}
            />
          ) : loadingDetail ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Loading consultation…</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 w-full">
              <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground/70">Select a consultation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a consultation from the list or create a new one
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Consultation List Item ── */
function ConsultationListItem({
  consultation: c,
  isSelected,
  onClick,
}: {
  consultation: Consultation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = c.ConsultationTicketAttribute?.status;
  const docCount =
    (c.Prescriptions?.length ?? 0) +
    (c.MedicalCertificates?.length ?? 0) +
    (c.LaboratoryRequests?.length ?? 0) +
    (c.ImagingRequests?.length ?? 0);

  const primaryHP = c.ConsultationTicketHPs[0]?.HealthCareProvider;
  const hpName = primaryHP?.HPProfile?.name
    ? `${primaryHP.HPProfile.title ?? ""} ${primaryHP.HPProfile.name}`.trim()
    : `${primaryHP?.User?.firstName ?? ""} ${primaryHP?.User?.lastName ?? ""}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
        isSelected ? "bg-primary/8 border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">
            {c.subject || c.Appointment?.subject || `Consultation #${c.id}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {c.Appointment?.AppointmentAttribute?.date
              ? dayjs(c.Appointment.AppointmentAttribute.date).format("MMM D, YYYY")
              : dayjs(c.createdAt).format("MMM D, YYYY")}
          </p>
          {hpName && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{hpName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            status === "RESOLVED"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : status === "DROPPED"
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {getStatusIcon(status)}
            {status === "RESOLVED" ? "Resolved" : status === "DROPPED" ? "Dropped" : "Active"}
          </div>
          {c.isArchived && (
            <Archive className="h-3 w-3 text-muted-foreground/50" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {(c.ConsultationNotes?.length ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {c.ConsultationNotes.length} note{c.ConsultationNotes.length !== 1 ? "s" : ""}
          </span>
        )}
        {docCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {docCount} doc{docCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
