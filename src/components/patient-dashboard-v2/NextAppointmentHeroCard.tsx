'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Update countdown every minute
  useEffect(() => {
    if (!appointment?.appointment?.date) return;

    const updateCountdown = () => {
      const now = new Date();
      const appointmentDate = new Date(appointment.appointment!.date!);
      const diff = appointmentDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownState({ daysLeft: 0, hoursLeft: 0, minutesLeft: 0 });
        return;
      }

      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdownState({ daysLeft, hoursLeft, minutesLeft });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [appointment?.appointment?.date]);

  if (isLoading) {
    return (
      <div className="w-full dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg animate-pulse">
        <div className="h-32 bg-slate-700/50 dark:bg-slate-700/50 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  if (!appointment?.appointment) {
    return (
      <div className="w-full dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 dark:text-slate-400 text-slate-600" />
          <p className="dark:text-slate-300 text-slate-700">No upcoming appointments</p>
          <p className="text-sm dark:text-slate-400 text-slate-600 mt-2">Schedule your next visit</p>
        </div>
      </div>
    );
  }

  const apt = appointment.appointment;
  const isToday = appointment.isToday;
  const isVirtual = apt.mode.name === 'VIRTUAL' || apt.mode.name === 'virtual';

  return (
    <div className="w-full dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-6 md:p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl">

      {/* Pulsing indicator for today */}
      {isToday && (
        <div className="absolute top-4 right-4">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium dark:text-blue-300 text-blue-600 mb-2">Next Appointment</p>
          <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 mb-1">
            {apt.doctor.firstName} {apt.doctor.lastName}
          </h2>
          <p className="text-sm dark:text-slate-300 text-slate-700">{apt.doctor.specialization || 'Healthcare Provider'}</p>
        </div>

        {/* Appointment Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Date */}
          <div className="p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs dark:text-slate-400 text-slate-600">Date</span>
            </div>
            <p className="font-semibold dark:text-white text-slate-900 text-sm md:text-base">
              {apt.date ? new Date(apt.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }) : 'TBD'}
            </p>
          </div>

          {/* Time */}
          <div className="p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs dark:text-slate-400 text-slate-600">Time</span>
            </div>
            <p className="font-semibold dark:text-white text-slate-900 text-sm md:text-base">
              {apt.timeStart || 'TBD'}
            </p>
          </div>

          {/* Location/Mode */}
          <div className="col-span-2 md:col-span-1 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-2 mb-2">
              {isVirtual ? (
                <Video className="w-4 h-4 text-purple-400" />
              ) : (
                <MapPin className="w-4 h-4 text-green-400" />
              )}
              <span className="text-xs dark:text-slate-400 text-slate-600">
                {isVirtual ? 'Mode' : 'Clinic'}
              </span>
            </div>
            <p className="font-semibold dark:text-white text-slate-900 text-sm md:text-base">
              {isVirtual ? 'Video Call' : apt.clinic.name}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="rounded-lg p-4 mb-6 dark:border-white/10 border-slate-200 border">
          <p className="text-xs dark:text-slate-300 text-slate-700 mb-3 font-medium">TIME TO APPOINTMENT</p>
          <div className="flex items-center justify-between md:justify-start md:gap-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold dark:text-blue-300 text-blue-700">
                {String(countdownState.daysLeft).padStart(2, '0')}
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Days</p>
            </div>
            <div className="text-l dark:text-slate-500 text-slate-400">:</div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold dark:text-purple-300 text-purple-700">
                {String(countdownState.hoursLeft).padStart(2, '0')}
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Hours</p>
            </div>
            <div className="text-l dark:text-slate-500 text-slate-400">:</div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold dark:text-pink-300 text-pink-700">
                {String(countdownState.minutesLeft).padStart(2, '0')}
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Minutes</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-red-500/20 dark:border-red-400/30 dark:text-red-300 bg-red-100/60 border-red-300/50 text-red-700 border text-xs font-medium">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                Today
              </span>
            )}
            {isVirtual && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-purple-500/20 dark:border-purple-400/30 dark:text-purple-300 bg-purple-100/60 border-purple-300/50 text-purple-700 border text-xs font-medium">
                <Video className="w-3 h-3" />
                Virtual
              </span>
            )}
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => {
              if (isToday && apt.meetingUrl) {
                window.open(apt.meetingUrl, '_blank');
              } else {
                router.push(`/clinics/${apt.clinic.uid}/appointments?_appointment=${apt.id}`);
              }
            }}
          >
            {isToday ? 'Join Now' : 'View Details'}
          </Button>
        </div>
      </div>
    </div>
  );
}

