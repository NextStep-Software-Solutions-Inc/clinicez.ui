'use client';

import { MessageSquare, Stethoscope, Clock } from 'lucide-react';
import { useState } from 'react';
import type { ConsultationNoteData } from '@/types/patient-dashboard-v2.types';

interface ConsultationNotesProps {
  consultations: ConsultationNoteData[] | null;
  isLoading?: boolean;
}

export function ConsultationNotes({ consultations, isLoading }: ConsultationNotesProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="dark:h-24 dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 h-24 bg-gradient-to-r from-slate-100/60 to-white/40 rounded-lg backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg text-center">
        <MessageSquare className="w-12 h-12 mx-auto dark:text-slate-400 text-slate-600 mb-4" />
        <p className="dark:text-slate-300 text-slate-700">No consultation notes yet</p>
        <p className="text-sm dark:text-slate-400 text-slate-600 mt-2">Notes from your doctor will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((consultation, index) => {
        const isExpanded = expandedId === index;
        const consultDate = new Date(consultation.createdAt);
        const doctorName = consultation.doctor.firstName && consultation.doctor.lastName
          ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}`
          : 'Unknown Doctor';

        return (
          <div
            key={index}
            className="group dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-lg backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg transition-all duration-300"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : index)}
              className="w-full p-4 text-left dark:hover:bg-white/5 hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <h4 className="font-semibold dark:text-white text-slate-900">
                      {consultation.sectionLabel || consultation.section}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-600 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    {consultDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {doctorName && (
                      <>
                        <span>•</span>
                        <span>{doctorName}</span>
                      </>
                    )}
                  </div>

                  {/* Preview */}
                  {!isExpanded && (
                    <p className="text-sm dark:text-slate-300 text-slate-700 line-clamp-2">
                      {consultation.content}
                    </p>
                  )}
                </div>

                {/* Expand indicator */}
                <div
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    className="w-5 h-5 dark:text-slate-400 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="dark:border-t dark:border-white/10 dark:bg-white/5 border-t border-slate-200 bg-slate-50/60 p-4">
                <div className="prose prose-invert max-w-none text-sm dark:prose-invert">
                  <p className="dark:text-slate-200 text-slate-800 whitespace-pre-wrap">
                    {consultation.content}
                  </p>
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 dark:border-t dark:border-white/10 border-t border-slate-200 flex flex-wrap gap-4 text-xs dark:text-slate-400 text-slate-600">
                  <div>
                    <p className="dark:text-slate-500 text-slate-600 mb-1">Doctor</p>
                    <p className="dark:text-slate-300 text-slate-800 font-medium">
                      {doctorName}
                    </p>
                  </div>
                  <div>
                    <p className="dark:text-slate-500 text-slate-600 mb-1">Date</p>
                    <p className="dark:text-slate-300 text-slate-800 font-medium">
                      {consultDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/30 bg-green-100/60 text-green-700 border-green-300/50 border">
                      Visible to you
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
