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
  Loader2,
  ChevronLeft,
} from "lucide-react";
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

/** Must match PAGE_SIZE in patient-consultations.action.ts */
const PAGE_SIZE = 20;

type QueueResult = NonNullable<GetClinicConsultationQueue["data"]>;
type QueueItem = QueueResult["items"][number];
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

/** Extracts patient info from a queue item. Returns null for walk-in consultations. */
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
  initialItems: QueueItem[];
  initialTotal: number;
  initialNextCursor: number | null;
  myHPs: NonNullable<GetHPsType>;
  /** Pre-selected consultation ID (from URL param / SSR). */
  initialActiveId?: number | null;
  /** Pre-fetched detail for the initial consultation (from server). */
  initialActiveDetail?: ConsultationDetail | null;
}

export default function ClinicConsultationsClient({
  clinicUid,
  initialItems,
  initialTotal,
  initialNextCursor,
  myHPs,
  initialActiveId = null,
  initialActiveDetail = null,
}: ClinicConsultationsClientProps) {
  // ── Mobile view state (list | workspace) ─────────────────────────────────
  const [mobileView, setMobileView] = useState<"list" | "workspace">(
    initialActiveId ? "workspace" : "list"
  );

  // ── Queue state ──────────────────────────────────────────────────────────
  const [items, setItems] = useState<QueueItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);

  // ── Workspace state ──────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<number | null>(initialActiveId);
  const [activeDetail, setActiveDetail] = useState<ConsultationDetail | null>(initialActiveDetail);
  const [activePatient, setActivePatient] = useState<PatientInfo | null>(() => {
    if (!initialActiveId) return null;
    const found = initialItems.find((q) => q.id === initialActiveId);
    return found ? buildPatientInfo(found) : null;
  });

  // ── Transitions ──────────────────────────────────────────────────────────
  const [loadingDetail, startDetailTransition] = useTransition();
  const [loadingMore, startLoadMoreTransition] = useTransition();
  const [refreshingQueue, startQueueTransition] = useTransition();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hpOnly, setHpOnly] = useState(false);
  const [search, setSearch] = useState("");

  // ── Refs ─────────────────────────────────────────────────────────────────
  const initialLoadDone = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Guards against multiple simultaneous load-more requests. */
  const loadMoreInFlight = useRef(false);

  /* ── Navigate to consultation without remounting (preserves scroll) ── */
  const pushUrl = useCallback(
    (id: number) => {
      window.history.replaceState(
        null,
        "",
        `/v2/clinic/${clinicUid}/consultations/${id}`
      );
    },
    [clinicUid]
  );

  /* ── Load detail ─────────────────────────────────────────────────────── */
  const loadDetail = useCallback(
    (item: QueueItem) => {
      const patient = buildPatientInfo(item);
      setSelectedId(item.id);
      setActivePatient(patient);
      pushUrl(item.id);
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
    [clinicUid, pushUrl]
  );

  /* ── Handle item selection (loads detail + switches to workspace on mobile) ── */
  const handleSelect = useCallback(
    (item: QueueItem) => {
      loadDetail(item);
      setMobileView("workspace"); // setMobileView is a stable useState setter — no dep needed
    },
    [loadDetail]
  );

  /* ── Auto-load first item on mount if no initial selection ── */
  useEffect(() => {
    if (!initialLoadDone.current && !initialActiveId && initialItems[0]) {
      initialLoadDone.current = true;
      loadDetail(initialItems[0]);
    }
  }, [initialItems, initialActiveId, loadDetail]);

  /* ── Refresh full queue when server-side filters change ── */
  useEffect(() => {
    startQueueTransition(async () => {
      const result = await getClinicConsultationQueueAction({
        clinicUid,
        status: statusFilter === "all" ? undefined : statusFilter,
        hpOnly,
      });
      if (result.status && result.data) {
        setItems(result.data.items);
        setTotal(result.data.total);
        setNextCursor(result.data.nextCursor);
      }
    });
  // `search` is intentionally excluded — it's applied client-side (filteredItems),
  // not as a server filter, so changing it must not re-fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicUid, statusFilter, hpOnly]);

  /* ── Load next page ── */
  const loadMore = useCallback(() => {
    if (!nextCursor || loadMoreInFlight.current) return;
    loadMoreInFlight.current = true;
    startLoadMoreTransition(async () => {
      try {
        const result = await getClinicConsultationQueueAction({
          clinicUid,
          status: statusFilter === "all" ? undefined : statusFilter,
          hpOnly,
          cursor: nextCursor,
        });
        if (result.status && result.data) {
          setItems((prev) => [...prev, ...result.data!.items]);
          setNextCursor(result.data.nextCursor);
        }
      } finally {
        loadMoreInFlight.current = false;
      }
    });
  }, [clinicUid, statusFilter, hpOnly, nextCursor]);

  /* ── IntersectionObserver — load more when sentinel enters view ── */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loadMoreInFlight.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadMore]);

  /* ── Patch a section of the active detail (called by workspace after mutations) ── */
  const handlePatchDetail = useCallback((patch: Partial<ConsultationDetail>) => {
    setActiveDetail((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  /* ── Update queue item status after resolve ── */
  const handleResolved = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ConsultationTicketAttribute: { status: "RESOLVED" },
            }
          : item
      )
    );
    setActiveDetail((prev) =>
      prev
        ? {
            ...prev,
            ConsultationTicketAttribute: prev.ConsultationTicketAttribute
              ? { ...prev.ConsultationTicketAttribute, status: "RESOLVED" }
              : null,
          }
        : null
    );
  }, []);

  /* ── Client-side search filter ── */
  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const u = item.Appointment?.Requesters?.[0]?.User;
    const patientName = u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase() : "";
    const subject = (item.subject ?? item.Appointment?.subject ?? "").toLowerCase();
    const caseNum = (item.caseNumber ?? "").toLowerCase();
    return patientName.includes(q) || subject.includes(q) || caseNum.includes(q);
  });

  const shownCount = filteredItems.length;

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] overflow-hidden">
      {/* ── Mobile back button (workspace → list) ── */}
      {mobileView === "workspace" && (
        <div className="md:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/80 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Queue
          </button>
        </div>
      )}

      {/* ── Split panel row ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* ── Left Panel: Queue ── */}
        <aside
          className={`shrink-0 flex-col border-r border-border/50 bg-background/60 overflow-hidden w-full md:w-80 ${
            mobileView === "workspace" ? "hidden md:flex" : "flex"
          }`}
        >
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
            {/* Showing X of Y */}
            <p className="text-[10px] text-muted-foreground">
              {refreshingQueue ? (
                "Loading…"
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-foreground/70">{shownCount}</span>
                  {!search.trim() && shownCount < total && (
                    <> of <span className="font-semibold text-foreground/70">{total}</span></>
                  )}{" "}
                  consultation{total !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>

          {/* Scrollable list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {filteredItems.length === 0 && !refreshingQueue ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No consultations found</p>
              </div>
            ) : (
              <>
                {filteredItems.map((item) => (
                  <QueueListItem
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    onClick={() => handleSelect(item)}
                  />
                ))}

                {/* Sentinel for IntersectionObserver */}
                <div ref={sentinelRef} className="h-1" />

                {/* Load-more indicator */}
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading more…
                  </div>
                )}
                {!loadingMore && nextCursor && !search.trim() && (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="w-full py-2.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  >
                    Load {Math.min(PAGE_SIZE, total - shownCount)} more
                  </button>
                )}
                {!nextCursor && items.length > 0 && !search.trim() && (
                  <p className="text-center text-[10px] text-muted-foreground/50 py-3">
                    All {total} consultation{total !== 1 ? "s" : ""} loaded
                  </p>
                )}
              </>
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
              patient={activePatient}
              consultation={activeDetail}
              myHPs={myHPs}
              onPatchDetail={handlePatchDetail}
              onResolved={handleResolved}
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
                <p className="text-base font-semibold text-foreground/70">Consultation Queue</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a consultation from the list to open the workspace
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
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
          <div className="flex items-center gap-1 mb-0.5">
            <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <p className="text-xs font-semibold text-foreground truncate">
              {patientName || (
                <span className="text-muted-foreground italic">Walk-in / no patient linked</span>
              )}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {item.subject ||
              item.Appointment?.subject ||
              item.Appointment?.complaint ||
              `Ticket #${item.id}`}
          </p>
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

      <div className="flex items-center gap-3 mt-1.5">
        {(item.ConsultationNotes?.length ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {item.ConsultationNotes.length} note
            {item.ConsultationNotes.length !== 1 ? "s" : ""}
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
