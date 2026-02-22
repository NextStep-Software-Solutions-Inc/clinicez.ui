"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Users, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddPatientSheet } from "./AddPatientSheet";
import {
  getClinicPatientsAction,
  type GetClinicPatientsResult,
} from "@/actions/clinics/clinic-patient.action";
import { PatientListView } from "@/components/patient/PatientListView";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ClinicPatientsClientProps {
  clinicUid: string;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Loading patients...</p>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <Users className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
        <Search
          className="absolute -bottom-2 -right-2 h-8 w-8 text-muted-foreground/20 animate-bounce"
          style={{ animationDelay: "0.5s" }}
        />
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No patients found</h3>
      <p className="text-sm text-muted-foreground/70">
        {search
          ? "Try adjusting your search criteria"
          : "Get started by adding your first patient"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ClinicPatientsClient({ clinicUid }: ClinicPatientsClientProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [allData, setAllData] = useState<GetClinicPatientsResult["data"]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = async (cursor?: number, append = false) => {
    try {
      const result = await getClinicPatientsAction({
        clinicUid,
        search: debouncedSearch || undefined,
        cursor,
        pageSize: PAGE_SIZE,
        gender: gender !== "all" ? gender : undefined,
      });
      if (append) {
        setAllData((prev) => [...prev, ...(result.data ?? [])]);
      } else {
        setAllData(result.data ?? []);
      }
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setTotalCount(result.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    setIsLoading(true);
    fetchPatients().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicUid, debouncedSearch, gender]);

  const handleLoadMore = () => {
    if (!nextCursor || isPending) return;
    startTransition(async () => {
      await fetchPatients(nextCursor, true);
    });
  };

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isPending]);

  return (
    <div className="flex flex-col h-full rounded-[0.5rem] border bg-background shadow">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
        <div className="space-y-4 px-4 sm:px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold">Patients</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {totalCount > 0
                  ? `Showing ${allData.length} of ${totalCount} patients`
                  : "View and manage clinic patients."}
              </p>
            </div>
            <AddPatientSheet
              clinicUid={clinicUid}
              onPatientAdded={() => {
                setIsLoading(true);
                fetchPatients().finally(() => setIsLoading(false));
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="sm:w-40">
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : allData.length === 0 ? (
        <EmptyState search={debouncedSearch} />
      ) : (
        <>
          <PatientListView patients={allData} viewMode="list" />

          {hasMore && (
            <div ref={observerTarget} className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Loading more patients...</p>
              </div>
            </div>
          )}

          {!hasMore && allData.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <p className="text-xs text-muted-foreground">No more patients to load</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
