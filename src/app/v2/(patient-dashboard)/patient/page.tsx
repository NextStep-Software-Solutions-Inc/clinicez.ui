'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import {
  NextAppointmentHeroCard,
  VitalsGrid,
  MedicationsCarousel,
  UpcomingAppointmentsList,
  ConsultationNotes,
  PendingLabWork,
  SelectClinicDialog,
  JoinAsPatientDialogV2,
} from '@/components/patient-dashboard-v2';
import { getPatientDashboardData } from '@/actions/patient-dashboard';
import { bookAppointmentAtom } from '@/state/book-appointment';
import { checkIsClinicPatientAction } from '@/actions/clinics/clinic-patient.action';

// Mobile loading skeleton
function DashboardLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 pt-2">
      {/* Hero greeting skeleton */}
      <div className="h-32 bg-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-2xl animate-pulse" />
      {/* Quick vitals row */}
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 w-28 flex-shrink-0 bg-slate-200/60 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
        ))}
      </div>
      {/* Card sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-slate-200/60 dark:bg-slate-700/50 rounded animate-pulse" />
          <div className="h-36 bg-slate-200/60 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function PatientDashboardContent() {
  const router = useRouter();
  const setBookAppointmentForm = useSetAtom(bookAppointmentAtom);
  const [showClinicDialog, setShowClinicDialog] = useState(false);
  const [pendingClinic, setPendingClinic] = useState<{ clinicUid: string; clinicName: string } | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const diagnosticRequestsRef = useRef<HTMLDivElement>(null);
  const prescriptionsRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData, isLoading, error } = useSWR(
    'patient-dashboard',
    getPatientDashboardData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000,
      focusThrottleInterval: 5 * 60 * 1000,
    }
  );

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6 text-center mt-4">
        <p className="text-red-600 dark:text-red-400 font-semibold">Unable to load dashboard</p>
        <p className="text-sm text-red-500 dark:text-red-300 mt-2">
          {error instanceof Error ? error.message : 'Please try refreshing the page'}
        </p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!dashboardData?.patient) return 'there';
    if (dashboardData.patient.nickname) return dashboardData.patient.nickname;
    return dashboardData.patient.firstName || 'there';
  };

  const getInitials = () => {
    if (!dashboardData?.patient) return '?';
    const f = dashboardData.patient.firstName?.[0] ?? '';
    const l = dashboardData.patient.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  };

  const handleScheduleAppointment = () => {
    setShowClinicDialog(true);
  };

  const handleClinicSelected = async (clinicUid: string, clinicName: string) => {
    setShowClinicDialog(false);
    setBookAppointmentForm((prev) => ({ ...prev, clinicUid }));

    const isAlreadyPatient = await checkIsClinicPatientAction(clinicUid);
    if (isAlreadyPatient) {
      router.push(`/v2/book-appointment?clinic=${clinicUid}`);
    } else {
      setPendingClinic({ clinicUid, clinicName });
      setShowJoinDialog(true);
    }
  };

  const handleJoinSuccess = () => {
    const clinicUid = pendingClinic?.clinicUid;
    setShowJoinDialog(false);
    setPendingClinic(null);
    router.push(`/v2/book-appointment?clinic=${clinicUid ?? ''}`);
  };

  return (
    <div className="w-full space-y-6 pt-2">

      {/* ── Hero Greeting Card ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-teal-100 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="text-white text-2xl font-bold mt-1 leading-tight">
              {getGreeting()},<br />
              <span className="truncate block">{getFirstName()}!</span>
            </h1>
          </div>
          {/* Avatar initials */}
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {isLoading ? (
              <span className="text-white/60">…</span>
            ) : (
              getInitials()
            )}
          </div>
        </div>
        {/* Subtle orb decoration */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -top-8 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* ── Quick Vitals Row ─────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Health Metrics
        </h2>
        <VitalsGrid vitals={dashboardData?.latestVitals || null} isLoading={isLoading} />
      </div>

      {/* ── Next Appointment ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Next Appointment
          </h2>
          <Link
            href="/v2/appointments-consultations"
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all →
          </Link>
        </div>
        <NextAppointmentHeroCard
          appointment={dashboardData?.nextAppointment || null}
          isLoading={isLoading}
        />
      </div>

      {/* ── Upcoming Appointments ────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Upcoming
        </h2>
        <UpcomingAppointmentsList
          appointments={dashboardData?.upcomingAppointments?.appointments || null}
          isLoading={isLoading}
        />
      </div>

      {/* ── Current Medications ──────────────────────────────── */}
      <div ref={prescriptionsRef}>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Current Medications
        </h2>
        <MedicationsCarousel
          prescriptions={dashboardData?.prescriptions?.prescriptions || null}
          lowRefillCount={dashboardData?.prescriptions?.lowRefillCount || 0}
          isLoading={isLoading}
        />
      </div>

      {/* ── Recent Consultations ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent Consultations
          </h2>
          <Link
            href="/v2/appointments-consultations"
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all →
          </Link>
        </div>
        <ConsultationNotes
          consultations={dashboardData?.recentConsultations?.consultations || null}
          isLoading={isLoading}
        />
      </div>

      {/* ── Lab & Diagnostics ────────────────────────────────── */}
      <div ref={diagnosticRequestsRef}>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Lab &amp; Diagnostics
        </h2>
        <PendingLabWork
          labRequests={dashboardData?.pendingLabWork?.requests || null}
          imagingRequests={dashboardData?.imagingRequests?.requests || null}
          heartStationRequests={dashboardData?.heartStationRequests?.requests || null}
          isLoading={isLoading}
        />
      </div>

      {/* Last Updated */}
      {dashboardData?.lastUpdated && (
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pb-2">
          Last updated{' '}
          {new Date(dashboardData.lastUpdated).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      {/* Select Clinic Dialog */}
      <SelectClinicDialog
        isOpen={showClinicDialog}
        onClose={() => setShowClinicDialog(false)}
        onClinicSelected={handleClinicSelected}
      />

      {/* Join as Patient consent dialog */}
      {pendingClinic && (
        <JoinAsPatientDialogV2
          clinicUid={pendingClinic.clinicUid}
          clinicName={pendingClinic.clinicName}
          isOpen={showJoinDialog}
          onClose={() => {
            setShowJoinDialog(false);
            setPendingClinic(null);
          }}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <PatientDashboardContent />
    </Suspense>
  );
}
