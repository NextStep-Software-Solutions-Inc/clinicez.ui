'use client';

import { useState } from 'react';
import { Beaker, AlertCircle, CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LaboratoryRequestData, ImagingRequestData, HeartStationRequestData } from '@/types/patient-dashboard-v2.types';

interface DiagnosticRequest {
  id: number;
  type: 'laboratory' | 'imaging' | 'heart-station';
  serialNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  procedures: string[];
  orderedBy?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
}

interface PendingLabWorkProps {
  labRequests?: LaboratoryRequestData[] | null;
  imagingRequests?: ImagingRequestData[] | null;
  heartStationRequests?: HeartStationRequestData[] | null;
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

export function PendingLabWork({ labRequests, imagingRequests, heartStationRequests, isLoading }: PendingLabWorkProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Consolidate all diagnostic requests
  const allRequests: DiagnosticRequest[] = [
    ...(labRequests?.map((lab) => ({
      id: lab.id,
      type: 'laboratory' as const,
      serialNumber: lab.serialNumber,
      status: lab.status,
      createdAt: lab.createdAt,
      procedures: lab.procedures,
      orderedBy: lab.orderedBy,
    })) ?? []),
    ...(imagingRequests?.map((img) => ({
      id: img.id,
      type: 'imaging' as const,
      serialNumber: img.serialNumber,
      status: img.status,
      createdAt: img.createdAt,
      procedures: img.procedures,
      orderedBy: img.orderedBy,
    })) ?? []),
    ...(heartStationRequests?.map((hs) => ({
      id: hs.id,
      type: 'heart-station' as const,
      serialNumber: hs.serialNumber,
      status: hs.status,
      createdAt: hs.createdAt,
      procedures: hs.procedures,
      orderedBy: hs.orderedBy,
    })) ?? []),
  ];

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'laboratory':
        return 'Laboratory';
      case 'imaging':
        return 'Imaging';
      case 'heart-station':
        return 'Heart Station';
      default:
        return 'Test Request';
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'laboratory':
        return 'from-blue-600 to-blue-500';
      case 'imaging':
        return 'from-purple-600 to-purple-500';
      case 'heart-station':
        return 'from-red-600 to-red-500';
      default:
        return 'from-slate-600 to-slate-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glassmorphic-card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!allRequests || allRequests.length === 0) {
    return (
      <div className="glassmorphic-card text-center">
        <Beaker className="w-12 h-12 mx-auto dark:text-slate-400 text-indigo-400 mb-4" />
        <p className="dark:text-slate-300 text-slate-600">No test requests</p>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-2">Lab, imaging, and heart station requests from your doctor will appear here</p>
      </div>
    );
  }

  const currentRequest = allRequests[currentIndex];
  const hasMultiple = allRequests.length > 1;

  return (
    <div className="space-y-3">
      {/* Carousel */}
      <div className="relative">
        <div
          key={currentIndex}
          className="group glassmorphic-card"
        >
          {/* Type Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getRequestTypeColor(currentRequest.type)} text-white text-xs font-semibold`}>
              {getRequestTypeLabel(currentRequest.type)}
            </span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2 flex-grow min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(currentRequest.status)}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-semibold dark:text-white text-slate-900 text-sm mb-1">Request #{currentRequest.serialNumber}</h4>
                {currentRequest.orderedBy && (
                  <p className="text-xs dark:text-slate-400 text-slate-600">
                    {currentRequest.orderedBy.firstName} {currentRequest.orderedBy.lastName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(currentRequest.status)}
            </div>
          </div>

          {/* Procedures */}
          {currentRequest.procedures && currentRequest.procedures.length > 0 && (
            <div className="mb-2">
              <p className="text-xs dark:text-slate-400 text-slate-600 mb-1.5 font-medium">Tests</p>
              <div className="flex flex-wrap gap-1.5">
                {currentRequest.procedures.map((procedure: string, pIndex: number) => (
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
              {new Date(currentRequest.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-xs dark:text-slate-400 text-slate-600">
              {currentIndex + 1} of {allRequests.length}
            </span>
          </div>
        </div>

        {/* Navigation */}
        {hasMultiple && (
          <div className="flex gap-2 mt-3 justify-center">
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? allRequests.length - 1 : prev - 1))}
              className="p-2 rounded-lg dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:text-slate-300 bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 transition-colors"
              aria-label="Previous request"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === allRequests.length - 1 ? 0 : prev + 1))}
              className="p-2 rounded-lg dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:text-slate-300 bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 transition-colors"
              aria-label="Next request"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
