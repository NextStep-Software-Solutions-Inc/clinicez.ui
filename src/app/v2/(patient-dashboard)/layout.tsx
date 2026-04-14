import React from 'react';
import { Metadata } from 'next';
import '@styles/patient-dashboard.css';
import { MobileHeader } from './_components/MobileHeader';
import { BottomNav } from './_components/BottomNav';

export const metadata: Metadata = {
  title: 'Patient Dashboard',
  description: 'Your personal health dashboard',
};

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen [background-image:var(--pattern-primary)] [background-size:400px_120px] [background-attachment:fixed] [animation:ecgScroll_40s_linear_infinite]">
      {/* Animated background gradient orbs with phase motion */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Appointment Card Color - Phase 1 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float-phase-1 opacity-10 dark:opacity-20" style={{background: 'radial-gradient(circle, var(--color-appointment-light), transparent)'}} />
        
        {/* Health/Vitals Color - Phase 2 */}
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float-phase-2 opacity-10 dark:opacity-20" style={{background: 'radial-gradient(circle, var(--color-health-light), transparent)'}} />
        
        {/* Medication Color - Phase 3 */}
        <div className="absolute -top-40 right-40 w-80 h-80 rounded-full blur-3xl animate-float-phase-3 opacity-10 dark:opacity-20" style={{background: 'radial-gradient(circle, var(--color-medication-light), transparent)'}} />
      </div>

      {/* Mobile Header — sticky top */}
      <MobileHeader />

      {/* Main content */}
      <main className="relative w-full z-10 bg-white/70 dark:bg-slate-800/70">
        <div className="max-w-screen-sm mx-auto px-4 pt-14 pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
