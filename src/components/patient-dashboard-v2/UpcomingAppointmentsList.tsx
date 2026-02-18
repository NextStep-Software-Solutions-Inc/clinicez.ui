'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Video, Stethoscope, CheckCircle, AlertCircle, X, Clock as ClockIcon, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardAppointment } from '@/types/patient-dashboard-v2.types';

interface UpcomingAppointmentsProps {
  appointments: DashboardAppointment[] | null;
  isLoading?: boolean;
}

function getStatusBadge(status: string) {
  const statusUpper = status.toUpperCase();
  
  switch (statusUpper) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Confirmed
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Pending
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-medium">
          <X className="w-3 h-3" />
          Cancelled
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-medium">
          <X className="w-3 h-3" />
          Rejected
        </span>
      );
    case 'RESCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-medium">
          <ClockIcon className="w-3 h-3" />
          Rescheduled
        </span>
      );
    case 'ROUTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-600 text-xs font-medium">
          <Send className="w-3 h-3" />
          Routed
        </span>
      );
    case 'RECEIVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-400/30 text-slate-300 text-xs font-medium">
          <Mail className="w-3 h-3" />
          Received
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-400/30 text-slate-300 text-xs font-medium">
          {statusUpper}
        </span>
      );
  }
}

export function UpcomingAppointmentsList({ appointments, isLoading }: UpcomingAppointmentsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glassmorphic-card h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="glassmorphic-card text-center">
        <Calendar className="w-12 h-12 mx-auto dark:text-slate-400 text-indigo-400 mb-4" />
        <p className="dark:text-slate-300 text-slate-600">No upcoming appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment, index) => {
        const appointmentDate = new Date(appointment.date!);
        const today = new Date();
        const isToday =
          appointmentDate.toDateString() === today.toDateString();
        const isTomorrow =
          appointmentDate.toDateString() ===
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();

        const doctorName = `${appointment.doctor.firstName ?? ''} ${appointment.doctor.lastName ?? ''}`.trim();
        const isVirtual = appointment.mode.name === 'VIRTUAL' || appointment.mode.name === 'virtual';

        return (
          <div
            key={index}
            className="group glassmorphic-card"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Date & Time */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold dark:text-white text-slate-900">
                    {appointmentDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-600 mb-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {appointment.timeStart || 'TBD'}
                </div>
                {isToday && (
                  <span className="text-xs dark:bg-red-500/30 dark:text-red-200 dark:border-red-400/30 bg-red-100/70 text-red-700 border-red-300/50 px-2 py-0.5 rounded-full border">
                    Today
                  </span>
                )}
                {isTomorrow && (
                  <span className="text-xs dark:bg-blue-500/30 dark:text-blue-200 dark:border-blue-400/30 bg-blue-100/70 text-blue-700 border-blue-300/50 px-2 py-0.5 rounded-full border">
                    Tomorrow
                  </span>
                )}
              </div>

              {/* Middle: Doctor & Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <p className="font-semibold dark:text-white text-slate-900 truncate">
                    {doctorName || 'Unknown'}
                  </p>
                </div>
                <p className="text-xs dark:text-slate-400 text-slate-600 mb-1.5 truncate">
                  {appointment.doctor.specialization || 'Healthcare Provider'}
                </p>

                {/* Location/Mode */}
                <div className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-600">
                  {isVirtual ? (
                    <>
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <span>Video Call</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-green-400" />
                      <span className="truncate">{appointment.clinic.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Status */}
              <div className="flex-shrink-0 text-right gap-1 flex items-baseline">
                {getStatusBadge(appointment.status)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    router.push(`/clinics/${appointment.clinic.uid}/appointments?_appointment=${appointment.id}`);
                  }}
                  className="mt-2 focus:outline-none active:outline-none focus-visible:outline-none focus-visible:ring-0"
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
