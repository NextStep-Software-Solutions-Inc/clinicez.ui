'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Pill, AlertCircle } from 'lucide-react';
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
  const router = useRouter();
  
  // Flatten medicines from prescriptions for carousel display
  const medications: MedicationCardData[] = prescriptions?.flatMap(rx =>
    rx.medicines.map(medicine => ({ medicine, prescription: rx }))
  ) ?? [];

  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="dark:h-40 dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 h-40 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg animate-pulse" />
        <div className="dark:h-4 dark:bg-slate-700/50 h-4 bg-slate-300/30 rounded w-20 animate-pulse" />
      </div>
    );
  }

  if (!medications || medications.length === 0) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg text-center">
        <Pill className="w-12 h-12 mx-auto dark:text-slate-400 text-slate-600 mb-4" />
        <p className="dark:text-slate-300 text-slate-700">No active prescriptions</p>
        <p className="text-sm dark:text-slate-400 text-slate-600 mt-2">Talk to your doctor about your medications</p>
      </div>
    );
  }

  const currentItem = medications[activeIndex];
  const { medicine, prescription } = currentItem;

  return (
    <div className="w-full">
      {/* Carousel Card */}
      <div className="relative">
        {/* Card */}
        <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-6 md:p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 mb-1">{medicine.name}</h3>
                <p className="text-sm dark:text-slate-300 text-slate-700">
                  Prescribed by {prescription.prescribedBy.firstName} {prescription.prescribedBy.lastName} · {prescription.clinic.name}
                </p>
              </div>
              <Pill className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Dosage */}
            <div className="dark:bg-white/5 dark:hover:bg-white/10 bg-white/50 hover:bg-white/70 rounded-lg p-4 backdrop-blur-sm transition-colors">
              <p className="text-xs dark:text-slate-400 text-slate-600 mb-1">Dosage</p>
              <p className="font-semibold dark:text-white text-slate-900 text-lg">
                {medicine.dosage ? `${medicine.dosage}${medicine.unit ? ` ${medicine.unit}` : ''}` : 'Not specified'}
              </p>
            </div>

            {/* Frequency */}
            <div className="dark:bg-white/5 dark:hover:bg-white/10 bg-white/50 hover:bg-white/70 rounded-lg p-4 backdrop-blur-sm transition-colors">
              <p className="text-xs dark:text-slate-400 text-slate-600 mb-1">Frequency</p>
              <p className="font-semibold dark:text-white text-slate-900 text-lg">{medicine.frequency || 'As needed'}</p>
            </div>

            {/* Quantity */}
            <div className="dark:bg-white/5 dark:hover:bg-white/10 bg-white/50 hover:bg-white/70 rounded-lg p-4 backdrop-blur-sm transition-colors">
              <p className="text-xs dark:text-slate-400 text-slate-600 mb-1">Quantity</p>
              <p className="font-semibold dark:text-white text-slate-900 text-lg">{medicine.qty || 'N/A'}</p>
            </div>

            {/* Duration */}
            <div className="dark:bg-white/5 dark:hover:bg-white/10 bg-white/50 hover:bg-white/70 rounded-lg p-4 backdrop-blur-sm transition-colors">
              <p className="text-xs dark:text-slate-400 text-slate-600 mb-1">Duration</p>
              <p className="font-semibold dark:text-white text-slate-900 text-lg">{medicine.duration || 'Ongoing'} days</p>
            </div>
          </div>

          {/* Notes */}
          {medicine.notes && (
            <div className="dark:bg-blue-500/10 dark:border-blue-400/30 bg-blue-100/60 border-blue-300/50 rounded-lg p-4 mb-6 border">
              <p className="text-sm dark:text-blue-200 text-blue-800">
                <span className="font-semibold">Notes: </span>
                {medicine.notes}
              </p>
            </div>
          )}

          {/* Low Refill Alert */}
          {medicine.qty !== null && medicine.qty < 5 && (
            <div className="dark:bg-yellow-500/10 dark:border-yellow-400/30 bg-yellow-100/60 border-yellow-300/50 rounded-lg p-4 mb-6 flex items-start gap-3 border">
              <AlertCircle className="w-5 h-5 dark:text-yellow-300 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm dark:text-yellow-100 text-yellow-800 font-semibold">Low quantity remaining</p>
                <p className="text-xs dark:text-yellow-200 text-yellow-700 mt-1">Contact your doctor soon for a refill</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button disabled className="w-full px-4 py-2 rounded-lg dark:bg-slate-700/50 dark:text-slate-400 bg-slate-300/50 text-slate-500 font-medium cursor-not-allowed opacity-60 transition-all duration-300">
            Coming Soon: View Details
          </button>
        </div>

        {/* Navigation - Desktop */}
        {medications.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i - 1 + medications.length) % medications.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-12 p-2 rounded-full dark:bg-white/10 dark:hover:bg-white/20 bg-slate-400/60 hover:bg-slate-400/80 backdrop-blur-sm transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 dark:text-white text-white" />
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i + 1) % medications.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-12 p-2 rounded-full dark:bg-white/10 dark:hover:bg-white/20 bg-slate-400/60 hover:bg-slate-400/80 backdrop-blur-sm transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 dark:text-white text-white" />
            </button>
          </>
        )}
      </div>

      {/* Carousel Indicator - Mobile & Desktop */}
      {medications.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {medications.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'dark:bg-emerald-500 bg-emerald-600 w-8' : 'dark:bg-white/20 bg-slate-400/40 w-2 dark:hover:bg-white/40 hover:bg-slate-400/60'
              }`}
              aria-label={`Go to medication ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Med Count */}
      {medications.length > 1 && (
        <p className="text-center text-sm dark:text-slate-400 text-slate-600 mt-4">
          {activeIndex + 1} of {medications.length} medications
        </p>
      )}

      {/* Low Refill Summary */}
      {lowRefillCount > 0 && (
        <div className="mt-6 dark:bg-yellow-500/10 dark:border-yellow-400/30 bg-yellow-100/60 border-yellow-300/50 rounded-lg p-4 flex items-start gap-3 border">
          <AlertCircle className="w-5 h-5 dark:text-yellow-300 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm dark:text-yellow-100 text-yellow-800 font-semibold">
              {lowRefillCount} {lowRefillCount === 1 ? 'medication needs' : 'medications need'} refill
            </p>
            <p className="text-xs dark:text-yellow-200 text-yellow-700 mt-1">Check refill status for all medications</p>
          </div>
        </div>
      )}
    </div>
  );
}
