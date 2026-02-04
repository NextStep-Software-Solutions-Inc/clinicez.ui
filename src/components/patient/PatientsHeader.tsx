'use client';

import SearchBar from "@components/dashboard/SearchBar";
import AddPatientModal from "@components/patient/modal/AddPatientModal";
import { PatientViewToggle } from "@components/patient/PatientViewToggle";
import { Slider } from "@components/ui/slider";
import { updateUrlParam } from "@/lib/url-utils";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useState, useEffect } from "react";
import { Label } from "../ui/label";

interface PatientsHeaderProps {
  clinicUid: string;
  patientCount?: number;
  totalPatients?: number;
}

export default function PatientsHeader({ clinicUid, patientCount = 0, totalPatients = 0 }: PatientsHeaderProps) {
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  const viewMode = (searchParams?.get("view") as 'list' | 'grid') || 'list';
  const gender = searchParams?.get("gender") || "all";
  const minAge = parseInt(searchParams?.get("minAge") || "0");
  const maxAge = parseInt(searchParams?.get("maxAge") || "120");

  const [localMinAge, setLocalMinAge] = useState(minAge);
  const [localMaxAge, setLocalMaxAge] = useState(maxAge);

  useEffect(() => {
    setLocalMinAge(minAge);
  }, [minAge]);

  useEffect(() => {
    setLocalMaxAge(maxAge);
  }, [maxAge]);

  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
      <div className="space-y-4 px-3 sm:px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold">Patients</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {totalPatients > 0 ? `Showing ${patientCount} of ${totalPatients} patients` : 'View and manage patients.'}
            </p>
          </div>
          <AddPatientModal clinicUid={clinicUid} roleName="patient" />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center just">
          {/* Search - Left */}
          <div className="flex-1 min-w-0">
            <SearchBar 
                className="lg:w-1/2"
                placeholder="Search patient name or email"
                value={search}
                onSearch={(value) => updateUrlParam("search", value)}
                debounceDelay={500}
            />
          </div>

          {/* Filters & View Toggle - Right */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center lg:whitespace-nowrap">
            {/* Gender Filter */}
            <div className="w-full lg:w-auto lg:min-w-[140px]">
              <Select value={gender} onValueChange={(value) => updateUrlParam("gender", value)}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range Slider */}
            <div className="w-full lg:w-auto lg:min-w-[440px]">
                <div className="grid w-full  gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="slider-demo-temperature">Age</Label>
                        <span className="text-muted-foreground text-sm">
                        {localMinAge}-{localMaxAge} years
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
                        onValueCommit={() => {
                            updateUrlParam("minAge", localMinAge.toString());
                            updateUrlParam("maxAge", localMaxAge.toString());
                        }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* View Toggle */}
            <div className="w-full lg:w-auto">
              <PatientViewToggle viewMode={viewMode} onViewChange={(mode) => updateUrlParam("view", mode)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
