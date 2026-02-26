'use client';

import { MessageSquare, Stethoscope, Clock } from 'lucide-react';
import type { ConsultationNoteData } from '@/types/patient-dashboard-v2.types';

interface ConsultationNotesProps {
  consultations: ConsultationNoteData[] | null;
  isLoading?: boolean;
}

export function ConsultationNotes({ consultations, isLoading }: ConsultationNotesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 dark:bg-slate-800/40 bg-slate-100/60 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-6 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg text-center">
        <MessageSquare className="w-10 h-10 mx-auto dark:text-slate-400 text-slate-600 mb-3" />
        <p className="dark:text-slate-300 text-slate-700 text-sm">No consultation notes yet</p>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Notes from your doctor will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {consultations.map((consultation) => {
        const consultDate = new Date(consultation.createdAt);
        const doctorName = consultation.doctor.firstName && consultation.doctor.lastName
          ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}`
          : 'Unknown Doctor';

        return (
          <div
            key={consultation.id}
            className="flex items-start gap-3 px-4 py-3 rounded-lg dark:bg-slate-800/40 bg-white/60 dark:border-white/10 border-slate-200/70 border"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full dark:bg-purple-500/20 bg-purple-100/70 flex items-center justify-center">
                <Stethoscope className="w-3.5 h-3.5 dark:text-purple-400 text-purple-600" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-semibold dark:text-white text-slate-900 text-sm truncate">
                  {consultation.sectionLabel || consultation.section}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0 dark:text-slate-400 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {consultDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 truncate">
                {doctorName}
                {consultation.content && (
                  <> · <span className="dark:text-slate-300 text-slate-700">{consultation.content}</span></>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
