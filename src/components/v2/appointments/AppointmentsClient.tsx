"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServices } from "@/actions/clinics/clinic-service.action";
import type { GetHPsType } from "@/actions/hp.actions";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { cn } from "@/lib/utils";

type Appointment = GetAppointments["data"][number];

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
}

export function AppointmentsClient({
  clinicUid,
  initialAppointments,
  counts,
  modes,
  types,
  services,
  hps,
}: AppointmentsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<StatusTabKey>("ALL");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const filtered =
    activeTab === "ALL"
      ? initialAppointments
      : initialAppointments.filter(
          (a) => a.AppointmentAttribute?.status === activeTab
        );

  return (
    <div
      className="flex flex-col rounded-2xl border shadow-sm"
      style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3 border-b"
        style={{ background: "hsl(var(--background) / 0.92)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Appointments</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {counts["ALL"] ?? 0} total appointments
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-1">Filter:</span>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-all duration-150 font-medium",
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {filtered.length === 0 ? (
          <EmptyState status={activeTab} />
        ) : (
          <div className="flex flex-col gap-2 px-4 py-4">
            {filtered.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                clinicUid={clinicUid}
                onSelect={setSelectedAppointment}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <AppointmentDetailSheet
        clinicUid={clinicUid}
        appointment={selectedAppointment}
        modes={modes}
        types={types}
        services={services}
        hps={hps}
        onClose={() => setSelectedAppointment(null)}
        onRefresh={refresh}
      />
    </div>
  );
}

function EmptyState({ status }: { status: StatusTabKey }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <CalendarDays className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-base font-semibold text-muted-foreground mb-1">
        No appointments found
      </h3>
      <p className="text-sm text-muted-foreground/60 text-center max-w-xs">
        {status === "ALL"
          ? "No appointments have been submitted yet."
          : `No ${status.toLowerCase()} appointments at this time.`}
      </p>
    </div>
  );
}
