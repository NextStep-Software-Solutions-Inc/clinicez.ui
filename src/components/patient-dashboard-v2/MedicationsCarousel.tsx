'use client';

import { Pill, AlertCircle, ChevronRight } from 'lucide-react';
import type { PrescriptionData, Medicine } from '@/types/patient-dashboard-v2.types';

interface MedicationCardData {
  medicine: Medicine;
  prescription: PrescriptionData;
}

interface MedicationsCarouselProps {
  prescriptions: PrescriptionData[] | null;
  lowRefillCount?: number;
  isLoading?: boolean;
}

export function MedicationsCarousel({ prescriptions, lowRefillCount = 0, isLoading }: MedicationsCarouselProps) {
  const medications: MedicationCardData[] = prescriptions?.flatMap(rx =>
    rx.medicines.map(medicine => ({ medicine, prescription: rx }))
  ) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 dark:bg-slate-800/40 bg-slate-100/60 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!medications || medications.length === 0) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-6 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg text-center">
        <Pill className="w-10 h-10 mx-auto dark:text-slate-400 text-slate-600 mb-3" />
        <p className="dark:text-slate-300 text-slate-700 text-sm">No active prescriptions</p>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">Talk to your doctor about your medications</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {medications.map(({ medicine, prescription }) => {
        const isLow = medicine.qty !== null && medicine.qty < 5;
        return (
          <div
            key={`${prescription.id}-${medicine.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg dark:bg-slate-800/40 dark:hover:bg-slate-700/50 bg-white/60 hover:bg-slate-50/80 dark:border-white/10 border-slate-200/70 border transition-colors"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full dark:bg-emerald-500/20 bg-emerald-100/70 flex items-center justify-center">
                <Pill className="w-4 h-4 dark:text-emerald-400 text-emerald-600" />
              </div>
            </div>

            {/* Name + meta */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold dark:text-white text-slate-900 text-sm truncate">
                  {medicine.name}
                </p>
                {isLow && (
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 truncate">
                {[
                  medicine.dosage ? `${medicine.dosage}${medicine.unit ? ` ${medicine.unit}` : ''}` : null,
                  medicine.frequency || null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'See prescription'}
                {' '}·{' '}{prescription.clinic.name}
              </p>
            </div>

            {/* Arrow hint */}
            <ChevronRight className="w-4 h-4 dark:text-slate-500 text-slate-400 flex-shrink-0" />
          </div>
        );
      })}

      {/* Low Refill Summary */}
      {lowRefillCount > 0 && (
        <div className="mt-2 dark:bg-yellow-500/10 dark:border-yellow-400/30 bg-yellow-100/60 border-yellow-300/50 rounded-lg px-4 py-2.5 flex items-center gap-2 border">
          <AlertCircle className="w-4 h-4 dark:text-yellow-300 text-yellow-700 flex-shrink-0" />
          <p className="text-xs dark:text-yellow-100 text-yellow-800 font-medium">
            {lowRefillCount} {lowRefillCount === 1 ? 'medication needs' : 'medications need'} a refill
          </p>
        </div>
      )}
    </div>
  );
}
