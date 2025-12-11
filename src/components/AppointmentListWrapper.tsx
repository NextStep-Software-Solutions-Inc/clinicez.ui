"use client";

import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { useClinicAppointments } from "@hooks/useAppointment";
import { AppointmentStatus, RoutedAptStatus } from "@public/json/appointment-list";
import { Filter, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GetAppointments } from "@actions/appointments/appointments.action";
import { AppointmentList } from "./appointment/AppointmentList";
import { useHPs } from "@hooks/useHP";


interface AppointmentListWrapperProps {
  clinicUid: string
}
export default function AppointmentListWrapper({ clinicUid }: AppointmentListWrapperProps) {
  const [query, setQuery] = useState("");
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedHPs, setSelectedHPs] = useState<number[]>([]);
  const searchParams = useSearchParams()
  const appointmentStatus = searchParams.get("_aptStatus")
  const routedAptStatus = searchParams.get("_routedAptStatus")
  const sort = searchParams.get("_sort") as "request" | "schedule"

  const { data: appointments } = useClinicAppointments({
    clinicUid,
    status: appointmentStatus?.toUpperCase() as AppointmentStatus,
    routedAptStatus: routedAptStatus?.toUpperCase() as RoutedAptStatus,
    sort
  })

  // Fetch healthcare providers for the clinic
  const { data: hps } = useHPs({ clinicUid })

  type AppointmentRequester = NonNullable<GetAppointments["data"]>[number]["Requesters"][number];

  const getRequesterColleges = useCallback((requester: AppointmentRequester) => {
    const user = requester.User;
    if (!user) return [] as string[];
    const studentColleges = user.StudentRecords?.map((record) => record.College?.name).filter(Boolean) ?? [];
    const employmentColleges = user.UserEmployments?.map((employment) => employment.College?.name).filter(Boolean) ?? [];
    return [...studentColleges, ...employmentColleges] as string[];
  }, []);

  const collegeOptions = useMemo(() => {
    const options = new Set<string>();
    (appointments?.data ?? []).forEach((appointment) => {
      appointment.Requesters.forEach((requester) => {
        getRequesterColleges(requester).forEach((college) => {
          if (college) options.add(college);
        });
      });
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [appointments, getRequesterColleges]);

  useEffect(() => {
    setSelectedColleges((prev) => {
      const filtered = prev.filter((college) => collegeOptions.includes(college));
      if (filtered.length === prev.length) return prev;
      return filtered;
    });
  }, [collegeOptions]);

  const toggleCollege = (college: string, checked: boolean) => {
    setSelectedColleges((prev) => {
      if (checked) {
        if (prev.includes(college)) return prev;
        return [...prev, college];
      }
      return prev.filter((item) => item !== college);
    });
  };

  const toggleHP = (hpId: number, checked: boolean) => {
    setSelectedHPs((prev) => {
      if (checked) {
        if (prev.includes(hpId)) return prev;
        return [...prev, hpId];
      }
      return prev.filter((item) => item !== hpId);
    });
  };

  const clearColleges = () => setSelectedColleges([]);
  const clearHPs = () => setSelectedHPs([]);

  const filteredAppointments = useMemo(() => {
    const withFallbackAppointments = appointments?.data ?? [];
    return withFallbackAppointments.filter((appointment) => {
      const queryLower = query.toLowerCase().trim();
      const matchesQuery = !queryLower
        || appointment.Requesters.some(requester => {
          const user = requester.User;
          if (!user) return false;

          // Search by user ID
          if (user.userId?.toLowerCase().includes(queryLower)) return true;

          // Search by student name (first name, middle name, last name, suffix)
          const firstName = user.firstName?.toLowerCase() ?? "";
          const middleName = user.middleName?.toLowerCase() ?? "";
          const lastName = user.lastName?.toLowerCase() ?? "";
          const suffix = user.suffix?.toLowerCase() ?? "";

          // Check individual name parts
          if (firstName.includes(queryLower)) return true;
          if (middleName.includes(queryLower)) return true;
          if (lastName.includes(queryLower)) return true;
          if (suffix.includes(queryLower)) return true;

          // Check full name combination
          const fullName = [firstName, middleName, lastName, suffix]
            .filter(Boolean)
            .join(" ");
          if (fullName.includes(queryLower)) return true;

          // Search by organization college
          const requesterColleges = getRequesterColleges(requester);
          if (requesterColleges.some(college => college.toLowerCase().includes(queryLower))) {
            return true;
          }

          return false;
        })
        || appointment.subject.toLowerCase().includes(queryLower)
        || appointment.complaint?.toLowerCase().includes(queryLower);

      const matchesCollege = selectedColleges.length === 0
        || appointment.Requesters.some((requester) => {
          const requesterColleges = getRequesterColleges(requester);
          return requesterColleges.some((college) => selectedColleges.includes(college));
        });

      const matchesHP = selectedHPs.length === 0
        || appointment.AppointmentRouting?.some((routing) => 
          selectedHPs.includes(routing.RoutedTo.id)
        ) || false;

      return matchesQuery && matchesCollege && matchesHP;
    });
  }, [appointments, getRequesterColleges, query, selectedColleges, selectedHPs])

  const updateQuery = (q: string) => {
    setQuery(q);
  }

  const totalFilters = selectedColleges.length + selectedHPs.length;

  return (
    <>
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8"
                type="search"
                value={query}
                onChange={e => updateQuery(e.target.value)}
              />
            </div>
          </form>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {totalFilters > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {totalFilters}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              {/* Healthcare Provider Filter */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Healthcare Providers</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={clearHPs}
                    disabled={selectedHPs.length === 0}
                  >
                    Clear
                  </Button>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {!hps?.data || hps.data.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No healthcare providers found.</p>
                  ) : (
                    hps.data.map((hp) => {
                      const isChecked = selectedHPs.includes(hp.id);
                      const hpName = hp.HPProfile?.name 
                        ? `${hp.HPProfile.title || ""} ${hp.HPProfile.name} ${hp.HPProfile.suffix || ""}`.trim()
                        : `${hp.User.firstName || ""} ${hp.User.lastName || ""}`.trim();
                      return (
                        <label key={hp.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => toggleHP(hp.id, checked === true)}
                          />
                          <span className="truncate">{hpName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              {/* College Filter */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Organization Colleges</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={clearColleges}
                  disabled={selectedColleges.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {collegeOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No colleges found.</p>
                )}
                {collegeOptions.map((college) => {
                  const isChecked = selectedColleges.includes(college);
                  return (
                    <label key={college} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => toggleCollege(college, checked === true)}
                      />
                      <span className="truncate">{college}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <AppointmentList appointments={filteredAppointments} />
    </>
  )
}