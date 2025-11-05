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


interface AppointmentListWrapperProps {
  clinicUid: string
}
export default function AppointmentListWrapper({ clinicUid }: AppointmentListWrapperProps) {
  const [query, setQuery] = useState("");
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
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

  const clearColleges = () => setSelectedColleges([]);

  const filteredAppointments = useMemo(() => {
    const withFallbackAppointments = appointments?.data ?? [];
    return withFallbackAppointments.filter((appointment) => {
      const queryLower = query.toLowerCase().trim();
      const matchesQuery = !queryLower
        || appointment.Requesters.some(requester => requester.User?.userId?.toLowerCase().includes(queryLower))
        || appointment.subject.toLowerCase().includes(queryLower)
        || appointment.complaint?.toLowerCase().includes(queryLower);

      const matchesCollege = selectedColleges.length === 0
        || appointment.Requesters.some((requester) => {
          const requesterColleges = getRequesterColleges(requester);
          return requesterColleges.some((college) => selectedColleges.includes(college));
        });

      return matchesQuery && matchesCollege;
    });
  }, [appointments, getRequesterColleges, query, selectedColleges])

  const updateQuery = (q: string) => {
    setQuery(q);
  }

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
                {selectedColleges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedColleges.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
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