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
  FloatingActionMenu,
  SelectClinicDialog,
  JoinAsPatientDialogV2,
} from '@/components/patient-dashboard-v2';
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle';
import { getPatientDashboardData } from '@/actions/patient-dashboard';
import { bookAppointmentAtom } from '@/state/book-appointment';
import { checkIsClinicPatientAction } from '@/actions/clinics/clinic-patient.action';
import BookAppointmentSheet from '@/components/appointment/BookAppointmentSheet';

// Loading skeleton for initial page load
function DashboardLoadingSkeleton() {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="h-12 bg-slate-300/40 dark:bg-slate-700/50 rounded-lg mb-8 animate-pulse" />

      {/* Main content skeletons */}
      <div className="space-y-6">
        {/* Hero card skeleton */}
        <div className="h-48 bg-slate-300/40 dark:bg-slate-700/50 rounded-2xl animate-pulse" />

        {/* Grid skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-300/40 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            <div className="h-80 bg-slate-300/40 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-slate-300/40 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            <div className="h-64 bg-slate-300/40 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
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
  const appointmentRef = useRef<HTMLDivElement>(null);
  
  const { data: dashboardData, isLoading, error } = useSWR(
    'patient-dashboard',
    getPatientDashboardData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      focusThrottleInterval: 5 * 60 * 1000,
    }
  );

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 text-center">
        <p className="text-red-300 font-semibold">Unable to load dashboard</p>
        <p className="text-sm text-red-200 mt-2">
          {error instanceof Error ? error.message : 'Please try refreshing the page'}
        </p>
      </div>
    );
  }

  // Header greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // FAB handlers
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
    const clinicUid = pendingClinic?.clinicUid
    setShowJoinDialog(false)
    setPendingClinic(null)
    router.push(`/v2/book-appointment?clinic=${clinicUid ?? ''}`)
  };

  const handleViewTestRequests = () => {
    diagnosticRequestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleViewPrescriptions = () => {
    prescriptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleViewProfile = () => {
    router.push('/v2/profile');
  };

  const handleViewHistory = () => {
    router.push('/v2/appointments-consultations');
  };

  return (
    <div className="w-full">
      {/* Header with greeting and theme toggle */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {getGreeting()},{' '}
            {dashboardData?.patient?.firstName || dashboardData?.patient?.lastName
              ? `${dashboardData.patient.firstName || ''} ${dashboardData.patient.lastName || ''}`.trim()
              : 'Patient'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Dashboard Grid - Mobile responsive */}
      <div className="space-y-6">
        {/* Hero: Next Appointment - Full Width */}
        <div ref={appointmentRef}>
          <NextAppointmentHeroCard
            appointment={dashboardData?.nextAppointment || null}
            isLoading={isLoading}
          />
        </div>

        {/* 3 Column Layout: 2 col main + 1 col sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vitals Grid */}
            <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Health Metrics
              </h2>
              <VitalsGrid vitals={dashboardData?.latestVitals || null} isLoading={isLoading} />
            </div>

            {/* Medications Carousel */}
            <div ref={prescriptionsRef}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                Current Medications
              </h2>
              <MedicationsCarousel
                prescriptions={dashboardData?.prescriptions?.prescriptions || null}
                lowRefillCount={dashboardData?.prescriptions?.lowRefillCount || 0}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Sidebar - Right (1 column) */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming</h2>
              <UpcomingAppointmentsList
                appointments={dashboardData?.upcomingAppointments?.appointments || null}
                isLoading={isLoading}
              />
            </div>

            {/* Pending Lab Work */}
            <div ref={diagnosticRequestsRef}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Diagnostic Requests</h2>
              <PendingLabWork
                labRequests={dashboardData?.pendingLabWork?.requests || null}
                imagingRequests={dashboardData?.imagingRequests?.requests || null}
                heartStationRequests={dashboardData?.heartStationRequests?.requests || null}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Full Width: Consultation Notes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Recent Consultations
            </h2>
            <Link
              href="/v2/appointments-consultations"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <ConsultationNotes
            consultations={
              dashboardData?.recentConsultations?.consultations
                ?.flatMap(summary => summary.notes) || null
            }
            isLoading={isLoading}
          />
        </div>

        {/* Last Updated Info */}
        {dashboardData?.lastUpdated && (
          <div className="text-center text-xs text-slate-500 dark:text-slate-500 mt-8">
            Last updated{' '}
            {new Date(dashboardData.lastUpdated).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onScheduleAppointment={handleScheduleAppointment}
        onViewTestRequests={handleViewTestRequests}
        onViewPrescriptions={handleViewPrescriptions}
        onViewProfile={handleViewProfile}
        onViewHistory={handleViewHistory}
      />

      {/* Select Clinic Dialog */}
      <SelectClinicDialog
        isOpen={showClinicDialog}
        onClose={() => setShowClinicDialog(false)}
        onClinicSelected={handleClinicSelected}
      />

      {/* Join as Patient consent dialog (shown when user is not yet a clinic patient) */}
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

      {/* BookAppointmentSheet: kept for V1 backward compatibility (?book-appointment=true query param) */}
      <BookAppointmentSheet />
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
