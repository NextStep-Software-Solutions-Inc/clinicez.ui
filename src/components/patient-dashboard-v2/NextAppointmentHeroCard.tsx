'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Video, Stethoscope, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime12Hr, combineDateWithTime } from '@/lib/day-utils';
import dayjs from '@/lib/day-utils';
import type { NextAppointmentData } from '@/types/patient-dashboard-v2.types';

interface NextAppointmentHeroCardProps {
  appointment: NextAppointmentData | null;
  isLoading?: boolean;
}

export function NextAppointmentHeroCard({ appointment, isLoading }: NextAppointmentHeroCardProps) {
  const router = useRouter();
  const [countdownState, setCountdownState] = useState({
    daysLeft: 0,
    hoursLeft: 0,
    minutesLeft: 0,
  });

  useEffect(() => {
    if (!appointment?.appointment?.date) return;

    const updateCountdown = () => {
      const now = new Date();
      // Combine date + timeStart for an accurate countdown
      const appointmentDateTime = combineDateWithTime(
        new Date(appointment.appointment!.date!),
        appointment.appointment!.timeStart,
      );
      const diff = appointmentDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownState({ daysLeft: 0, hoursLeft: 0, minutesLeft: 0 });
        return;
      }

      setCountdownState({
        daysLeft: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hoursLeft: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutesLeft: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [appointment?.appointment?.date, appointment?.appointment?.timeStart]);

  if (isLoading) {
    return (
      <div className="w-full dark:bg-slate-800/40 bg-white/60 rounded-xl px-6 py-5 border dark:border-white/10 border-slate-200 animate-pulse h-24" />
    );
  }

  // No upcoming appointment — show most recent past appointment with elapsed time
  if (!appointment?.appointment) {
    const prev = appointment?.previousAppointment ?? null;

    if (!prev) {
      return (
        <div className="w-full dark:bg-slate-800/40 bg-white/60 rounded-xl px-6 py-5 border dark:border-white/10 border-slate-200/70 flex items-center gap-3">
          <Calendar className="w-9 h-9 dark:text-slate-500 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium dark:text-slate-300 text-slate-700">No upcoming appointments</p>
            <p className="text-xs dark:text-slate-400 text-slate-500">Schedule your next visit with your doctor</p>
          </div>
        </div>
      );
    }

    const prevDateTime = prev.date
      ? combineDateWithTime(new Date(prev.date), prev.timeStart)
      : null;
    const elapsedLabel = prevDateTime ? dayjs(prevDateTime).fromNow() : null;
    const isVirtualPrev = prev.mode.name === 'VIRTUAL' || prev.mode.name === 'virtual';
    const doctorName = prev.doctor.hpName ?? `${prev.doctor.firstName ?? ''} ${prev.doctor.lastName ?? ''}`.trim();

    return (
      <div className="w-full dark:bg-slate-800/40 bg-white/60 rounded-xl px-6 py-5 border dark:border-white/10 border-slate-200/70 flex flex-wrap items-center gap-4 relative">
        {/* Previous appointment badge */}
        <span className="absolute top-3 right-3 text-xs dark:bg-slate-700/60 bg-slate-100 dark:text-slate-300 text-slate-600 px-2 py-0.5 rounded font-medium">
          Previous Appointment
        </span>

        {/* Doctor info */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0 max-w-[260px]">
          <div className="w-11 h-11 rounded-full dark:bg-blue-500/20 bg-blue-100/70 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 dark:text-blue-400 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm dark:text-blue-300 text-blue-600 font-medium mb-0.5">Previous Appointment</p>
            <p
              className="font-semibold dark:text-white text-slate-900 text-base leading-tight truncate"
              title={doctorName || 'Unknown'}
            >
              {doctorName || 'Unknown'}
            </p>
            <p className="text-xs dark:text-slate-400 text-slate-600 truncate">
              {prev.doctor.specialization || 'Healthcare Provider'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-slate-200" />

        {/* Date / Time / Location chips */}
        <div className="flex flex-wrap items-center gap-3 flex-grow">
          <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-medium">
              {prev.date
                ? new Date(prev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-medium">{formatTime12Hr(prev.timeStart)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
            {isVirtualPrev ? (
              <Video className="w-4 h-4 text-purple-400 flex-shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
            <span className="font-medium truncate max-w-[160px]" title={isVirtualPrev ? 'Video Call' : prev.clinic.name}>
              {isVirtualPrev ? 'Video Call' : prev.clinic.name}
            </span>
          </div>

          {/* Elapsed time chip */}
          {elapsedLabel && (
            <div className="flex items-center gap-1.5 ml-auto">
              <History className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />
              <span className="text-xs dark:text-slate-300 text-slate-600 font-medium">{elapsedLabel}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-slate-200" />

        {/* CTA */}
        <Button
          onClick={() => router.push(`/v2/appointments-consultations?appointment=${prev.id}`)}
        >
          View Details
        </Button>
      </div>
    );
  }

  const apt = appointment.appointment;
  const isToday = appointment.isToday;
  const isVirtual = apt.mode.name === 'VIRTUAL' || apt.mode.name === 'virtual';
  const hasMeetLink = !!apt.meetingUrl;

  return (
    <div className="w-full dark:bg-slate-800/40 bg-white/60 rounded-xl px-6 py-5 border dark:border-white/10 border-slate-200/70 flex flex-wrap items-center gap-4 relative">
      {/* Today pulse */}
      {isToday && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      {/* Doctor info */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0 max-w-[260px]">
        <div className="w-11 h-11 rounded-full dark:bg-blue-500/20 bg-blue-100/70 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 dark:text-blue-400 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm dark:text-blue-300 text-blue-600 font-medium mb-0.5">Next Appointment</p>
          <p
            className="font-semibold dark:text-white text-slate-900 text-base leading-tight truncate"
            title={apt.doctor.hpName ?? `${apt.doctor.firstName} ${apt.doctor.lastName}`}
          >
            {apt.doctor.hpName ?? `${apt.doctor.firstName} ${apt.doctor.lastName}`}
          </p>
          <p
            className="text-xs dark:text-slate-400 text-slate-600 truncate"
            title={apt.doctor.specialization || 'Healthcare Provider'}
          >
            {apt.doctor.specialization || 'Healthcare Provider'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-slate-200" />

      {/* Date / Time / Location chips */}
      <div className="flex flex-wrap items-center gap-3 flex-grow">
        <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
          <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium">
            {apt.date ? new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium">{formatTime12Hr(apt.timeStart)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-700">
          {isVirtual ? (
            <Video className="w-4 h-4 text-purple-400 flex-shrink-0" />
          ) : (
            <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
          )}
          <span
            className="font-medium truncate max-w-[160px]"
            title={isVirtual ? 'Video Call' : apt.clinic.name}
          >
            {isVirtual ? 'Video Call' : apt.clinic.name}
          </span>
        </div>

        {/* Compact countdown */}
        <div className="flex items-center gap-1 text-sm font-mono ml-auto">
          <span className="dark:bg-slate-700/60 bg-slate-100 dark:text-blue-300 text-blue-700 px-2 py-1 rounded font-semibold">
            {String(countdownState.daysLeft).padStart(2, '0')}d
          </span>
          <span className="dark:text-slate-500 text-slate-400">:</span>
          <span className="dark:bg-slate-700/60 bg-slate-100 dark:text-purple-300 text-purple-700 px-2 py-1 rounded font-semibold">
            {String(countdownState.hoursLeft).padStart(2, '0')}h
          </span>
          <span className="dark:text-slate-500 text-slate-400">:</span>
          <span className="dark:bg-slate-700/60 bg-slate-100 dark:text-pink-300 text-pink-700 px-2 py-1 rounded font-semibold">
            {String(countdownState.minutesLeft).padStart(2, '0')}m
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 dark:bg-white/10 bg-slate-200" />

      {/* CTA */}
      <Button
        onClick={() => {
          if (hasMeetLink) {
            window.open(apt.meetingUrl!, '_blank');
          } else {
            router.push(`/v2/appointments-consultations?appointment=${apt.id}`);
          }
        }}
      >
        {hasMeetLink ? 'Join Now' : 'View Details'}
      </Button>
    </div>
  );
}

