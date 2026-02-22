"use client";

import { Search, X, SlidersHorizontal, LayoutGrid, List, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useEffect, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ClinicPatientFilters } from "@/types/clinic-patients-v2.types";
import { AddPatientSheet } from "./AddPatientSheet";

interface PatientsHeaderProps {
  clinicUid: string;
  filters: ClinicPatientFilters;
  totalCount: number;
  loadedCount: number;
  onFiltersChange: (patch: Partial<ClinicPatientFilters>) => void;
  onPatientAdded?: () => void;
  /** Auto-open the AddPatientSheet on first render (e.g. after redirect from walk-in flow) */
  initialAddPatientOpen?: boolean;
}

export const PatientsHeader = memo(function PatientsHeader({
  clinicUid,
  filters,
  totalCount,
  loadedCount,
  onFiltersChange,
  onPatientAdded,
  initialAddPatientOpen = false,
}: PatientsHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localMinAge, setLocalMinAge] = useState(filters.minAge);
  const [localMaxAge, setLocalMaxAge] = useState(filters.maxAge);
  const [addPatientOpen, setAddPatientOpen] = useState(initialAddPatientOpen);

  // Remove ?addPatient=1 from URL once the sheet opens, keeping other params intact
  useEffect(() => {
    if (!initialAddPatientOpen) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("addPatient");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ search: localSearch });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
  }, []);

  const activeFilterCount = [
    filters.gender !== "all" ? 1 : 0,
    filters.minAge > 0 || filters.maxAge < 120 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <>
      <AddPatientSheet
        open={addPatientOpen}
        clinicUid={clinicUid}
        onClose={() => setAddPatientOpen(false)}
        onSuccess={() => {
          setAddPatientOpen(false);
          onPatientAdded?.();
        }}
      />

      <div
        className="sticky top-12 z-10 rounded-t-2xl border-b backdrop-blur-sm"
        style={{
          background: "hsl(var(--background) / 0.92)",
          borderColor: "hsl(var(--color-border-light, var(--border)))",
        }}
      >
        {/* ── Top row: title + search + view toggle ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-4 pb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight">Patients</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCount > 0
                ? `Showing ${loadedCount} of ${totalCount} patients`
                : "No patients found"}
            </p>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search name or email…"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2">
            {/* Add Patient button */}
            <Button
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setAddPatientOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Patient
            </Button>

            {/* Filters toggle */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* View toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => onFiltersChange({ viewMode: "list" })}
                className={`px-2.5 py-1.5 transition-colors ${
                  filters.viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => onFiltersChange({ viewMode: "grid" })}
                className={`px-2.5 py-1.5 transition-colors ${
                  filters.viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Expandable filter row ─────────────────────────────────────────── */}
        {filtersOpen && (
            <div
              className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 pb-4 pt-2 border-t"
              style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
            >
              {/* Gender */}
              <div className="w-full sm:w-40">
                <Label className="text-xs mb-1.5 block">Gender</Label>
                <Select
                  value={filters.gender}
                  onValueChange={(v) => onFiltersChange({ gender: v })}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age range */}
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">Age range</Label>
                  <span className="text-xs text-muted-foreground">
                    {localMinAge}–{localMaxAge} yrs
                  </span>
                </div>
                <Slider
                  min={0}
                  max={120}
                  step={1}
                  value={[localMinAge, localMaxAge]}
                  onValueChange={([min, max]) => {
                    setLocalMinAge(min);
                    setLocalMaxAge(max);
                  }}
                  onValueCommit={([min, max]) => {
                    onFiltersChange({ minAge: min, maxAge: max });
                  }}
                  className="w-full"
                />
              </div>

              {/* Reset */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs self-center"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  setLocalMinAge(0);
                  setLocalMaxAge(120);
                  onFiltersChange({ gender: "all", minAge: 0, maxAge: 120 });
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            </div>
        )}
      </div>
    </>
  );
});
