"use client";

import { useState, useCallback, useRef, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, UserPlus, Loader2, Tag, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAppointmentsAction, type GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServices } from "@/actions/clinics/clinic-service.action";
import type { GetHPsType } from "@/actions/hp.actions";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { WalkInAppointmentSheet } from "./WalkInAppointmentSheet";
import { ConfirmBookingSheet } from "./ConfirmBookingSheet";
import { AssignDoctorDialog } from "./AssignDoctorDialog";
import { PreAssessmentNoteDialog } from "./PreAssessmentNoteDialog";
import { TagHPDialog } from "./TagHPDialog";
import { cn } from "@/lib/utils";

type Appointment = NonNullable<GetAppointments["data"]>[number];

const PAGE_SIZE = 20;

/** Pure helper — lives outside the component so it's not recreated on render */
function getHpDisplayName(hp: GetHPsType[number]): string {
  if (hp.HPProfile?.name) return hp.HPProfile.name;
  const parts = [hp.HPProfile?.title, hp.User.firstName, hp.User.lastName].filter(Boolean);
  return parts.join(" ") || `HP #${hp.id}`;
}

/** Which sub-panel is active. null = nothing open */
type ActivePanel =
  | null
  | "detail"
  | "walkIn"
  | "confirm"
  | "assign"
  | "preAssessment"
  | "tag";

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "RECEIVED", label: "Received" },
  { key: "ROUTED", label: "Routed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
] as const;

type StatusTabKey = (typeof STATUS_TABS)[number]["key"];

interface AppointmentsClientProps {
  clinicUid: string;
  initialAppointments: Appointment[];
  counts: Record<string, number>;
  modes: GetAppointmentModes;
  types: GetAppointmentTypes;
  services: GetClinicServices;
  hps: GetHPsType;
  currentUserHpIds: number[];
  currentUserSub: string;
  /** Tab names (uppercased) visible to the current user's role. null = show all. */
  visibleTabNames: string[] | null;
}

export function AppointmentsClient({
  clinicUid,
  initialAppointments,
  counts,
  modes,
  types,
  services,
  hps,
  currentUserHpIds,
  currentUserSub,
  visibleTabNames,
}: AppointmentsClientProps) {
  const router = useRouter();

  // Filter status tabs based on the current user's role configuration.
  // "ALL" is always shown. If visibleTabNames is null (no restriction), show everything.
  const allowedStatusTabs = visibleTabNames
    ? STATUS_TABS.filter(
        (t) => t.key === "ALL" || visibleTabNames.includes(t.key)
      )
    : STATUS_TABS;

  // Status tab filter (client-side on loaded items)
  const [activeTab, setActiveTab] = useState<StatusTabKey>("ALL");

  // Server-side filters — when changed, reset pagination and re-fetch
  const [hpFilters, setHpFilters] = useState<number[]>([]);
  const [taggedOnly, setTaggedOnly] = useState(false);

  // Pagination: start with initial data; hasMore=true when initial page is full
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [hasMore, setHasMore] = useState(initialAppointments.length >= PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Selected appointment + active panel (single-dialog pattern)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // ── Panel helpers ──────────────────────────────────────────────────────────

  const openDetail = useCallback((appt: Appointment) => {
    setSelectedAppointment(appt);
    setActivePanel("detail");
  }, []);

  const closeAll = useCallback(() => {
    setActivePanel(null);
    setSelectedAppointment(null);
  }, []);

  const openSubPanel = useCallback((panel: Exclude<ActivePanel, null | "detail" | "walkIn">) => {
    setActivePanel(panel);
  }, []);

  const backToDetail = useCallback(() => {
    setActivePanel("detail");
  }, []);

  // Pre-assessment note edit state (populated when user clicks "Edit" on an existing note)
  const [preAssessmentEditData, setPreAssessmentEditData] = useState<{
    assessment: string;
    homeInstructions: string;
    remarks: string;
  } | null>(null);

  const handleOpenPreAssessmentEdit = useCallback(
    (note: { assessment: string; homeInstructions?: string | null; remarks: string }) => {
      setPreAssessmentEditData({
        assessment: note.assessment,
        homeInstructions: note.homeInstructions ?? "",
        remarks: note.remarks,
      });
      setActivePanel("preAssessment");
    },
    []
  );

  // ── Server-side filter reload ───────────────────────────────────────────────

  const reloadWithFilters = useCallback(
    async (opts: { hpIds: number[]; tagged: boolean }) => {
      setIsReloading(true);
      try {
        const result = await getAppointmentsAction({
          clinicUid,
          ...(opts.hpIds.length > 0 ? { hpIds: opts.hpIds } : {}),
          ...(opts.tagged ? { tagged: "true" } : {}),
        });
        if (result.status && result.data) {
          setAppointments(result.data);
          setHasMore(result.data.length >= PAGE_SIZE);
        } else {
          setAppointments([]);
          setHasMore(false);
        }
      } finally {
        setIsReloading(false);
      }
    },
    [clinicUid]
  );

  const handleHpFilterToggle = useCallback(
    (id: number) => {
      const next = hpFilters.includes(id)
        ? hpFilters.filter((x) => x !== id)
        : [...hpFilters, id];
      setHpFilters(next);
      setActiveTab("ALL");
      void reloadWithFilters({ hpIds: next, tagged: taggedOnly });
    },
    [hpFilters, taggedOnly, reloadWithFilters]
  );

  const handleClearHpFilters = useCallback(() => {
    setHpFilters([]);
    setActiveTab("ALL");
    void reloadWithFilters({ hpIds: [], tagged: taggedOnly });
  }, [taggedOnly, reloadWithFilters]);

  const handleTaggedToggle = useCallback(() => {
    const next = !taggedOnly;
    setTaggedOnly(next);
    setActiveTab("ALL");
    void reloadWithFilters({ hpIds: hpFilters, tagged: next });
  }, [taggedOnly, hpFilters, reloadWithFilters]);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Keep in sync when parent server component rerenders (router.refresh)
  useEffect(() => {
    setAppointments(initialAppointments);
    setHasMore(initialAppointments.length >= PAGE_SIZE);
  }, [initialAppointments]);

  // Auto-sync the detail sheet: when the appointments list updates (after refresh),
  // update selectedAppointment so the detail sheet shows the latest data.
  useEffect(() => {
    if (selectedAppointment) {
      const updated = appointments.find((a) => a.id === selectedAppointment.id);
      if (updated) {
        setSelectedAppointment(updated);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  // ── Load more ─────────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || appointments.length === 0) return;
    const lastId = appointments[appointments.length - 1].id;
    setIsLoadingMore(true);
    try {
      const result = await getAppointmentsAction({
        clinicUid,
        cursor: lastId,
        ...(hpFilters.length > 0 ? { hpIds: hpFilters } : {}),
        ...(taggedOnly ? { tagged: "true" } : {}),
      });
      if (result.status && result.data) {
        const newItems = result.data;
        setAppointments((prev) => {
          // Deduplicate by id
          const seen = new Set(prev.map((a) => a.id));
          return [...prev, ...newItems.filter((a) => !seen.has(a.id))];
        });
        // If we got fewer than PAGE_SIZE items, no more pages
        setHasMore(newItems.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [clinicUid, appointments, hasMore, isLoadingMore, hpFilters, taggedOnly]);

  // IntersectionObserver for scroll-to-load-more
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered =
    activeTab === "ALL"
      ? appointments
      : appointments.filter((a) => a.AppointmentAttribute?.status === activeTab);

  const totalCount = counts["ALL"] ?? 0;

  return (
    <div
      className="flex flex-col rounded-2xl border shadow-sm"
      style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
    >
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 rounded-t-2xl border-b bg-background/95 backdrop-blur-sm px-5 pt-4 pb-3">
        {/* Row 1: Title + showing count + Walk-In button */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
            <h2 className="font-semibold text-sm">Appointments</h2>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Showing{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>{" "}
            appointments
          </p>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-primary/90 hover:bg-primary text-xs flex-shrink-0"
            onClick={() => setActivePanel("walkIn")}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Walk-In
          </Button>
        </div>

        {/* Row 2: Status tabs + HP filter + Tagged toggle */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-wrap flex-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mr-0.5 flex-shrink-0" />
            {allowedStatusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-2.5 py-0.5 text-xs rounded-full border transition-all duration-150 font-medium",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/60 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {tab.label}
                {counts[tab.key] !== undefined && (
                  <span className="ml-1 opacity-70">({counts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* HP multi-filter + Tagged toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* HP multi-select Popover */}
            {hps.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border transition-all duration-150 font-medium",
                      hpFilters.length > 0
                        ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                        : "bg-background/60 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <span>
                      {hpFilters.length === 0
                        ? "All Providers"
                        : hpFilters.length === 1
                        ? getHpDisplayName(hps.find((h) => h.id === hpFilters[0]) ?? hps[0])
                        : `${hpFilters.length} Providers`}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {hps.map((hp) => {
                      const checked = hpFilters.includes(hp.id);
                      return (
                        <button
                          key={hp.id}
                          type="button"
                          onClick={() => handleHpFilterToggle(hp.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
                            checked
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            checked ? "bg-primary border-primary" : "border-border"
                          )}>
                            {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                          <span className="line-clamp-1">{getHpDisplayName(hp)}</span>
                          {hp.HPType?.name && (
                            <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                              {hp.HPType.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {hpFilters.length > 0 && (
                    <div className="border-t mt-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={handleClearHpFilters}
                        className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-center"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* My Tagged toggle */}
            <button
              onClick={handleTaggedToggle}
              disabled={isReloading}
              className={cn(
                "flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border transition-all duration-150 font-medium",
                taggedOnly
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-background/60 border-border/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
              title="Show only appointments where I am tagged"
            >
              <Tag className="h-3 w-3" />
              My Tagged
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {isReloading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {filtered.length === 0 && !isLoadingMore && !isReloading ? (
          <EmptyState status={activeTab} taggedOnly={taggedOnly} hpFiltered={hpFilters.length > 0} />
        ) : (
          <div className="flex flex-col gap-2 px-4 py-4">
            {filtered.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onSelect={openDetail}
                onRefresh={refresh}
              />
            ))}

            {/* Scroll sentinel + load-more messages */}
            <div ref={loaderRef} className="py-3 text-center">
              {isLoadingMore && (
                <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more appointments…
                </span>
              )}
              {!isLoadingMore && !hasMore && appointments.length > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  All appointments loaded
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Single-dialog pattern: only one Sheet/Dialog open at a time ── */}

      {/* Detail sheet — hidden when a sub-panel is active */}
      <AppointmentDetailSheet
        appointment={activePanel === "detail" ? selectedAppointment : null}
        clinicUid={clinicUid}
        currentUserHpIds={currentUserHpIds}
        currentUserSub={currentUserSub}
        onClose={closeAll}
        onRefresh={refresh}
        onOpenSubPanel={openSubPanel}
        onEditPreAssessmentNote={handleOpenPreAssessmentEdit}
      />

      {/* Walk-in creation */}
      <WalkInAppointmentSheet
        open={activePanel === "walkIn"}
        clinicUid={clinicUid}
        modes={modes}
        types={types}
        services={services}
        hps={hps}
        onClose={() => setActivePanel(null)}
        onSuccess={() => {
          setActivePanel(null);
          refresh();
        }}
      />

      {/* Confirm Booking — replaces detail sheet */}
      {selectedAppointment && (
        <ConfirmBookingSheet
          open={activePanel === "confirm"}
          appointment={selectedAppointment}
          modes={modes}
          types={types}
          services={services}
          hps={hps}
          onClose={backToDetail}
          onSuccess={() => {
            refresh();
            closeAll();
          }}
        />
      )}

      {/* Assign Doctor — replaces detail sheet */}
      {selectedAppointment && (
        <AssignDoctorDialog
          open={activePanel === "assign"}
          appointment={selectedAppointment}
          hps={hps}
          onClose={backToDetail}
          onSuccess={() => {
            refresh();
            backToDetail();
          }}
        />
      )}

      {/* Pre-Assessment Note — replaces detail sheet */}
      {selectedAppointment && (
        <PreAssessmentNoteDialog
          open={activePanel === "preAssessment"}
          appointmentId={selectedAppointment.id}
          clinicUid={clinicUid}
          initialAssessment={preAssessmentEditData?.assessment}
          initialHomeInstructions={preAssessmentEditData?.homeInstructions}
          initialRemarks={preAssessmentEditData?.remarks}
          onClose={() => { setPreAssessmentEditData(null); backToDetail(); }}
          onSuccess={() => {
            setPreAssessmentEditData(null);
            refresh();
            backToDetail();
          }}
        />
      )}

      {/* Tag HP — replaces detail sheet */}
      {selectedAppointment && (
        <TagHPDialog
          open={activePanel === "tag"}
          appointmentId={selectedAppointment.id}
          hps={hps}
          taggedHpIds={(selectedAppointment.AppointmentTag ?? []).map((t) => t.HealthcareProvider.id)}
          onClose={backToDetail}
          onSuccess={() => {
            refresh();
            backToDetail();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ status, taggedOnly, hpFiltered }: { status: StatusTabKey; taggedOnly: boolean; hpFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <CalendarDays className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-base font-semibold text-muted-foreground mb-1">
        No appointments found
      </h3>
      <p className="text-sm text-muted-foreground/60 text-center max-w-xs">
        {taggedOnly
          ? "No appointments where you are tagged."
          : hpFiltered
          ? "No appointments for the selected healthcare provider."
          : status === "ALL"
          ? "No appointments have been submitted yet."
          : `No ${status.toLowerCase()} appointments at this time.`}
      </p>
    </div>
  );
}
