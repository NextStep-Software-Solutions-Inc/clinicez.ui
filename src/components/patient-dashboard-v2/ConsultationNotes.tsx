'use client';

import { MessageSquare, Stethoscope, Clock, FileText } from 'lucide-react';
import type { ConsultationSummary } from '@/types/patient-dashboard-v2.types';

interface ConsultationNotesProps {
  consultations: ConsultationSummary[] | null;
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

  const nonEmptyConsultations = consultations?.filter(c => c.notes.length > 0) ?? [];

  if (nonEmptyConsultations.length === 0) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-6 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg text-center">
        <MessageSquare className="w-10 h-10 mx-auto dark:text-slate-400 text-slate-600 mb-3" />
        <p className="dark:text-slate-300 text-slate-700 text-sm">No consultation notes yet</p>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Notes from your doctor will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nonEmptyConsultations.map((summary) => (
        <div key={summary.ticketId}>
          {/* Group separator / header */}
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold dark:text-slate-300 text-slate-600 truncate">
                {summary.subject || 'Consultation'}
              </span>
              {summary.caseNumber && (
                <span className="text-xs dark:text-slate-500 text-slate-400 flex-shrink-0">
                  #{summary.caseNumber}
                </span>
              )}
            </div>
            <div className="flex-grow h-px dark:bg-white/10 bg-slate-200" />
            <span className="text-xs dark:text-slate-500 text-slate-400 flex-shrink-0">
              {new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Notes in this group */}
          <div className="space-y-1 pl-1">
            {summary.notes.map((note) => {
              const doctorName = note.doctor.firstName && note.doctor.lastName
                ? `${note.doctor.firstName} ${note.doctor.lastName}`
                : 'Unknown Doctor';

              return (
                <div
                  key={note.id}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-lg dark:bg-slate-800/40 bg-white/60 dark:border-white/10 border-slate-200/70 border"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full dark:bg-purple-500/20 bg-purple-100/70 flex items-center justify-center">
                      <Stethoscope className="w-3 h-3 dark:text-purple-400 text-purple-600" />
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p
                        className="font-semibold dark:text-white text-slate-900 text-xs truncate"
                        title={note.sectionLabel || note.section}
                      >
                        {note.sectionLabel || note.section}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0 dark:text-slate-500 text-slate-400 text-xs">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <p
                      className="text-xs dark:text-slate-400 text-slate-600 truncate"
                      title={note.content ? `${doctorName} · ${note.content}` : doctorName}
                    >
                      {doctorName}
                      {note.content && (
                        <> · <span className="dark:text-slate-300 text-slate-700">{note.content}</span></>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

