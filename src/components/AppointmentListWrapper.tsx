"use client";

import { Input } from "@components/ui/input";
import { useClinicAppointments } from "@hooks/useAppointment";
import { AppointmentStatus, RoutedAptStatus } from "@public/json/appointment-list";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppointmentList } from "./appointment/AppointmentList";


interface AppointmentListWrapperProps {
  clinicUid: string
  }
export default function AppointmentListWrapper({clinicUid}:AppointmentListWrapperProps) {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams()
  const appointmentStatus = searchParams.get("_aptStatus")
  const routedAptStatus = searchParams.get("_routedAptStatus")
  const sort = searchParams.get("_sort") as "request" | "schedule"
    
  const {data : appointments} = useClinicAppointments({
    clinicUid, 
    status: appointmentStatus?.toUpperCase() as AppointmentStatus, 
    routedAptStatus: routedAptStatus?.toUpperCase() as RoutedAptStatus,
    sort
  })
  
  const filteredAppointments = useMemo(() => {
    const withFallbackAppointments = appointments?.data ?? [];
    if (!query) return withFallbackAppointments;
    return withFallbackAppointments.filter((appointment) => {
      return (
        appointment.Requesters.some(requester => requester.User.userId.toLowerCase().includes(query.toLowerCase())) ||
          appointment.subject.toLowerCase().includes(query.toLowerCase()) ||
          appointment.complaint?.toLowerCase().includes(query.toLowerCase())
      );
    });
  },[appointments,query])
  
  const updateQuery = (q: string) => {
    setQuery(q);
  }
    
  return (
    <>
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" type="search" value={query} onChange={e => updateQuery(e.target.value)} />
          </div>
        </form>
      </div>
      <AppointmentList appointments={filteredAppointments} />
    </>
  )
}