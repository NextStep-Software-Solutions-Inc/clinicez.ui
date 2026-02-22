import type { GetClinicPatientsResult } from "@/actions/clinics/clinic-patient.action";

// ─── Patient list item ────────────────────────────────────────────────────────

export type ClinicPatientListItem = GetClinicPatientsResult["data"][number];

// ─── Filter shape ─────────────────────────────────────────────────────────────

export interface ClinicPatientFilters {
    search: string;
    gender: string;
    minAge: number;
    maxAge: number;
    viewMode: "list" | "grid";
}

export const DEFAULT_CLINIC_PATIENT_FILTERS: ClinicPatientFilters = {
    search: "",
    gender: "all",
    minAge: 0,
    maxAge: 120,
    viewMode: "list",
};

// ─── Pagination hook result ───────────────────────────────────────────────────

export interface UseClinicPatientsPaginationResult {
    patients: ClinicPatientListItem[];
    totalCount: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
    filters: ClinicPatientFilters;
    setFilters: React.Dispatch<React.SetStateAction<ClinicPatientFilters>>;
}

// ─── Server action input shape (for v2 page) ─────────────────────────────────

export interface ClinicPatientsPageProps {
    params: Promise<{ clinicUid: string }>;
    searchParams?: Promise<Record<string, string | undefined>>;
}

// ─── Initial SSR data passed to the client component ─────────────────────────

export interface ClinicPatientsInitialData {
    patients: ClinicPatientListItem[];
    totalCount: number;
    nextCursor: number | null;
    hasMore: boolean;
}
