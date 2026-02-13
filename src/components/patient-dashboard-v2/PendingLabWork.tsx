'use client';

import { Beaker, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { LaboratoryRequestData } from '@/types/patient-dashboard-v2.types';

interface PendingLabWorkProps {
  labRequests: LaboratoryRequestData[] | null;
  isLoading?: boolean;
}



function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'cancelled':
      return <X className="w-5 h-5 text-red-400" />;
    default:
      return <Beaker className="w-5 h-5 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Pending
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-medium">
          <X className="w-3 h-3" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-400/30 text-slate-300 text-xs font-medium">
          {statusLower}
        </span>
      );
  }
}

export function PendingLabWork({ labRequests, isLoading }: PendingLabWorkProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glassmorphic-card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!labRequests || labRequests.length === 0) {
    return (
      <div className="glassmorphic-card text-center">
        <Beaker className="w-12 h-12 mx-auto dark:text-slate-400 text-indigo-400 mb-4" />
        <p className="dark:text-slate-300 text-slate-600">No lab work requests</p>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-2">Lab requests from your doctor will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {labRequests.map((lab, index) => {
        const requestDate = new Date(lab.createdAt);

        return (
          <div
            key={index}
            className="group glassmorphic-card"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 flex-grow min-w-0">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(lab.status)}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold dark:text-white text-slate-900 text-sm mb-1">Lab Work</h4>
                  {lab.orderedBy && (
                    <p className="text-xs dark:text-slate-400 text-slate-600">
                      {lab.orderedBy.firstName} {lab.orderedBy.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(lab.status)}
              </div>
            </div>

            {/* Procedures - Simple layout */}
            {lab.procedures && lab.procedures.length > 0 && (
              <div className="mb-2">
                <p className="text-xs dark:text-slate-400 text-slate-600 mb-1.5 font-medium">Tests</p>
                <div className="flex flex-wrap gap-1.5">
                  {lab.procedures.map((procedure: string, pIndex: number) => (
                    <span
                      key={pIndex}
                      className="text-xs px-2 py-1 rounded-md dark:bg-white/10 dark:text-slate-300 dark:border-white/10 bg-slate-100/50 text-slate-700 border-slate-200/50 border"
                    >
                      {procedure}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs">
              <span className="dark:text-slate-400 text-slate-600">
                {requestDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <button className="text-xs px-3 py-1 rounded-md dark:bg-blue-600/20 dark:hover:bg-blue-600/40 dark:text-blue-300 dark:border-blue-400/30 bg-blue-100/60 hover:bg-blue-200/60 text-blue-700 border-blue-300/50 font-medium border transition-all">
                View
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
