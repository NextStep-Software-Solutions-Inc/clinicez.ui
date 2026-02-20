"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
import type {
    ClinicPatientFilters,
    ClinicPatientListItem,
    UseClinicPatientsPaginationResult,
    ClinicPatientsInitialData,
} from "@/types/clinic-patients-v2.types";
import { DEFAULT_CLINIC_PATIENT_FILTERS } from "@/types/clinic-patients-v2.types";

interface UseClinicPatientsPaginationOptions {
    clinicUid: string;
    pageSize?: number;
    /** Initial SSR data hydrated from page.tsx */
    initialData?: ClinicPatientsInitialData;
    /** Filters pre-parsed from the URL (overrides defaults) */
    initialFilters?: Partial<ClinicPatientFilters>;
}

/**
 * Abstracts cursor-based pagination for clinic patients.
 *
 * - On first mount it uses `initialData` (SSR hydration) to avoid a
 *   redundant round-trip.
 * - When `filters` change a fresh fetch is made and previous data is
 *   discarded (the loading flag flips so a skeleton shows up).
 * - `loadMore()` appends the next page using the current cursor.
 */
export function useClinicPatientsPagination({
    clinicUid,
    pageSize = 50,
    initialData,
    initialFilters,
}: UseClinicPatientsPaginationOptions): UseClinicPatientsPaginationResult {
    // ── Compute init values once (useRef so they don't re-run every render) ──
    const init = useRef(() => {
        const merged: ClinicPatientFilters = { ...DEFAULT_CLINIC_PATIENT_FILTERS, ...initialFilters };
        const matchesDefaults = !initialFilters ||
            Object.entries(initialFilters).every(
                ([k, v]) => v === DEFAULT_CLINIC_PATIENT_FILTERS[k as keyof ClinicPatientFilters]
            );
        return { merged, matchesDefaults };
    });
    const { merged: mergedInitialFilters, matchesDefaults: urlFiltersMatchDefaults } = init.current();

    // ── Local filter state ────────────────────────────────────────────────────
    const [filters, setFilters] = useState<ClinicPatientFilters>(mergedInitialFilters);
    // Keep a ref so loadMore can always read current filters without being in deps
    const filtersRef = useRef(filters);
    useEffect(() => { filtersRef.current = filters; }, [filters]);

    // ── Pagination state ──────────────────────────────────────────────────────
    const [patients, setPatients] = useState<ClinicPatientListItem[]>(
        urlFiltersMatchDefaults ? (initialData?.patients ?? []) : []
    );
    const [totalCount, setTotalCount] = useState(
        urlFiltersMatchDefaults ? (initialData?.totalCount ?? 0) : 0
    );
    const [nextCursor, setNextCursor] = useState<number | null>(
        urlFiltersMatchDefaults ? (initialData?.nextCursor ?? null) : null
    );
    const [hasMore, setHasMore] = useState(
        urlFiltersMatchDefaults ? (initialData?.hasMore ?? false) : false
    );

    // ── Loading flags ─────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, startLoadMoreTransition] = useTransition();

    // Track whether we've already consumed the server-side initial data
    const isFirstMount = useRef(urlFiltersMatchDefaults);

    // ── Fetch helpers ─────────────────────────────────────────────────────────

    /** Full reload when filters change → replaces patient list */
    const fetchInitial = useCallback(
        async (activeFilters: ClinicPatientFilters) => {
            setIsLoading(true);
            try {
                const result = await getClinicPatientsAction({
                    clinicUid,
                    search: activeFilters.search || undefined,
                    cursor: undefined,
                    pageSize,
                    gender: activeFilters.gender !== "all" ? activeFilters.gender : undefined,
                    minAge: activeFilters.minAge || undefined,
                    maxAge: activeFilters.maxAge !== 120 ? activeFilters.maxAge : undefined,
                });

                setPatients(result.data ?? []);
                setNextCursor(result.nextCursor);
                setHasMore(result.hasMore);
                setTotalCount(result.total ?? 0);
            } catch (err) {
                console.error("[useClinicPatientsPagination] fetchInitial error:", err);
                setPatients([]);
                setTotalCount(0);
                setHasMore(false);
                setNextCursor(null);
            } finally {
                setIsLoading(false);
            }
        },
        [clinicUid, pageSize]
    );

    /** Append next page to existing list */
    const loadMore = useCallback(() => {
        if (!nextCursor || isLoadingMore || !hasMore) return;

        startLoadMoreTransition(async () => {
            try {
                const f = filtersRef.current;
                const result = await getClinicPatientsAction({
                    clinicUid,
                    search: f.search || undefined,
                    cursor: nextCursor,
                    pageSize,
                    gender: f.gender !== "all" ? f.gender : undefined,
                    minAge: f.minAge || undefined,
                    maxAge: f.maxAge !== 120 ? f.maxAge : undefined,
                });

                setPatients((prev) => [...prev, ...(result.data ?? [])]);
                setNextCursor(result.nextCursor);
                setHasMore(result.hasMore);
            } catch (err) {
                console.error("[useClinicPatientsPagination] loadMore error:", err);
            }
        });
    }, [clinicUid, pageSize, nextCursor, isLoadingMore, hasMore]);

    // ── Effect: re-fetch when filters change ─────────────────────────────────
    useEffect(() => {
        // Skip first mount if we already have SSR data
        if (isFirstMount.current && initialData) {
            isFirstMount.current = false;
            return;
        }
        isFirstMount.current = false;

        fetchInitial(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    return {
        patients,
        totalCount,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        filters,
        setFilters,
    };
}
