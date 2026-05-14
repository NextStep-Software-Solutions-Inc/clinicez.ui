import React from 'react';
import { Metadata } from 'next';
import '@styles/patient-dashboard.css';
import { PatientDashboardHeader } from './_components/PatientDashboardHeader';
import { BottomNav } from './_components/BottomNav';
import { HeaderTitleProvider } from './_components/HeaderTitleContext';

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
    <HeaderTitleProvider>
      <div className="min-h-screen [background-image:var(--pattern-primary)] [background-size:32px_32px] [background-attachment:fixed]">
        {/* Subtle background gradient orbs — balanced left/right */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, rgb(20,184,166), transparent)'}} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-[0.07] dark:opacity-[0.12]" style={{background: 'radial-gradient(circle, rgb(99,102,241), transparent)'}} />
        </div>

        {/* Patient Dashboard Header — sticky top */}
        <PatientDashboardHeader />

        {/* Main content */}
        <main className="relative z-10 min-h-screen bg-white/80 dark:bg-slate-900/80 md:bg-transparent">
          <div className="mx-auto w-full max-w-screen-sm px-4 pt-16 pb-24 md:max-w-6xl md:px-6 md:pt-24 md:pb-10">
            <div className="md:rounded-3xl md:border md:border-slate-200/70 md:bg-white/85 md:p-6 md:shadow-sm md:backdrop-blur-sm dark:md:border-slate-700/60 dark:md:bg-slate-900/80 lg:p-8">
              {children}
            </div>
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </HeaderTitleProvider>
  );
}
