"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2, Users, Search } from "lucide-react";
import { useClinicPatientsPagination } from "@/hooks/v2/useClinicPatientsPagination";
import { PatientsHeader } from "./PatientsHeader";
import { PatientCard } from "./PatientCard";
import { PatientListSkeleton } from "./PatientListSkeleton";
import type {
  ClinicPatientsInitialData,
  ClinicPatientFilters,
} from "@/types/clinic-patients-v2.types";
import { DEFAULT_CLINIC_PATIENT_FILTERS } from "@/types/clinic-patients-v2.types";

// ── Typed URL param parser ────────────────────────────────────────────────────
function parseFiltersFromParams(
  params: ReturnType<typeof useSearchParams>
): Partial<ClinicPatientFilters> {
  const parsed: Partial<ClinicPatientFilters> = {};
  const q = params.get("q");
  const gender = params.get("gender");
  const minAge = params.get("minAge");
  const maxAge = params.get("maxAge");
  const view = params.get("view");

  if (q) parsed.search = q;
  if (gender && gender !== DEFAULT_CLINIC_PATIENT_FILTERS.gender) parsed.gender = gender;
  if (minAge !== null) parsed.minAge = Math.max(0, parseInt(minAge, 10) || 0);
  if (maxAge !== null) parsed.maxAge = Math.min(120, parseInt(maxAge, 10) || 120);
  if (view === "grid" || view === "list") parsed.viewMode = view;

  return parsed;
}

interface ClinicPatientsClientProps {
  clinicUid: string;
  pageSize?: number;
  initialData: ClinicPatientsInitialData;
  /** When true, the AI Patient Insight button is shown on each patient card */
  isProvider?: boolean;
}

export function ClinicPatientsClient({
  clinicUid,
  pageSize = 50,
  initialData,
  isProvider = false,
}: ClinicPatientsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse initial filters from URL once (stable across renders via ref)
  const initialFilters = useRef(parseFiltersFromParams(searchParams)).current;
  // Auto-open AddPatientSheet when navigated from walk-in flow (?addPatient=1)
  const initialAddPatientOpen = searchParams.get("addPatient") === "1";
  const {
    patients,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    filters,
    setFilters,
    refresh,
  } = useClinicPatientsPagination({ clinicUid, pageSize, initialData, initialFilters });

  // ── Infinite scroll ──────────────────────────────────────────────────────
  // Attach to the always-rendered wrapper div so it works regardless of whether
  // the sentinel is visible (e.g. during initial isLoading state).
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollRoot = container.closest<HTMLElement>('[data-scroll-root]');
    if (!scrollRoot) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
      if (scrollHeight - scrollTop - clientHeight < 400 && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMoreRef.current();
      }
    };

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // trigger once in case already near bottom
    return () => scrollRoot.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync filters → URL ───────────────────────────────────────────────────
  // Skip the very first run to avoid a pointless router.replace on fresh page load
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.gender !== DEFAULT_CLINIC_PATIENT_FILTERS.gender) params.set("gender", filters.gender);
    if (filters.minAge !== DEFAULT_CLINIC_PATIENT_FILTERS.minAge) params.set("minAge", String(filters.minAge));
    if (filters.maxAge !== DEFAULT_CLINIC_PATIENT_FILTERS.maxAge) params.set("maxAge", String(filters.maxAge));
    if (filters.viewMode !== DEFAULT_CLINIC_PATIENT_FILTERS.viewMode) params.set("view", filters.viewMode);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, pathname, router]);

  const handleFiltersChange = useCallback((patch: Partial<ClinicPatientFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, [setFilters]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col rounded-2xl border shadow-sm"
      style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
    >
      {/* Header / Filters */}
      <PatientsHeader
        clinicUid={clinicUid}
        filters={filters}
        totalCount={totalCount}
        loadedCount={patients.length}
        onFiltersChange={handleFiltersChange}
        onPatientAdded={refresh}
        initialAddPatientOpen={initialAddPatientOpen}
      />

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          /* Filter-change skeleton — mirrors real row layout */
          <PatientListSkeleton count={8} viewMode={filters.viewMode} />
        ) : patients.length === 0 ? (
          <EmptyState search={filters.search} />
        ) : (
          <>
            <div
              className={
                filters.viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 px-4 py-4"
                  : "flex flex-col gap-2 px-4 py-4"
              }
            >
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  clinicUid={clinicUid}
                  viewMode={filters.viewMode}
                  isProvider={isProvider}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div className="flex justify-center items-center py-6">
              {isLoadingMore ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading more…</p>
                </div>
              ) : !hasMore && patients.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  All {totalCount} patients loaded
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <Users className="h-16 w-16 text-muted-foreground/20 animate-pulse" />
        <Search
          className="absolute -bottom-2 -right-2 h-7 w-7 text-muted-foreground/20 animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
      <h3 className="text-base font-semibold text-muted-foreground mb-1">
        No patients found
      </h3>
      <p className="text-sm text-muted-foreground/60 text-center max-w-xs">
        {search
          ? "Try adjusting your search or filter criteria."
          : "No patients have been registered to this clinic yet."}
      </p>
    </div>
  );
}
