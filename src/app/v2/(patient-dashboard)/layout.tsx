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
    <div className="min-h-screen [background-image:var(--pattern-primary)] [background-size:32px_32px] [background-attachment:fixed]">
      {/* Subtle background gradient orbs — balanced left/right */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, rgb(20,184,166), transparent)'}} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, rgb(99,102,241), transparent)'}} />
      </div>

      {/* Mobile Header — sticky top */}
      <MobileHeader />

      {/* Main content */}
      <main className="relative w-full z-10 min-h-screen bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-screen-sm mx-auto px-4 pt-16 pb-24">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
