'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Syringe,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { ImmunizationCategory } from '@prisma/client'
import {
  CATEGORY_METADATA,
  detectRecommendedCategory,
  groupVaccinationsByFamily,
} from '@/lib/immunizations/immunization-utils'

export interface VaccinationsBookletViewProps {
  vaccinations: any[]
  dob?: string | Date | null
  age?: number | null
  gender?: string | null
  isPregnant?: boolean | null
}

export function VaccinationsBookletView({
  vaccinations,
  dob,
  age,
  gender,
  isPregnant,
}: VaccinationsBookletViewProps) {
  const recommendedCategory = useMemo(() => {
    return detectRecommendedCategory({ dob, age, gender, isPregnant })
  }, [dob, age, gender, isPregnant])

  const groupedData = useMemo(() => {
    return groupVaccinationsByFamily(vaccinations, recommendedCategory)
  }, [vaccinations, recommendedCategory])

  if (!vaccinations || vaccinations.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
        No immunizations logged. Click edit to record vaccination.
      </div>
    )
  }

  // Filter series that either have administered doses or belong to the recommended category
  const activeSeries = groupedData.standardSeriesList.filter(
    (s) => s.completedCount > 0 || s.family.category === recommendedCategory
  )

  return (
    <div className="space-y-4">
      {/* Code 999 Status Banner if documented */}
      {groupedData.noneRecords.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">PhilHealth Code 999 Documented: </span>
            Patient has documented <strong>No Immunizations Given</strong> (Recorded on{' '}
            {new Date(groupedData.noneRecords[0].dateGiven).toLocaleDateString()}).
          </div>
        </div>
      )}

      {/* Series Cards Grid */}
      {activeSeries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activeSeries.map((series) => {
            const isComplete = series.isComplete
            const nextDose = series.nextPendingDose

            return (
              <div
                key={series.family.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isComplete
                    ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : series.completedCount > 0
                    ? 'border-teal-200 dark:border-teal-950/40 bg-teal-50/15 dark:bg-teal-950/10'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {series.family.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({series.family.description})
                      </span>
                    </div>
                    {series.family.scheduleDescription && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Schedule: {series.family.scheduleDescription}
                      </div>
                    )}
                  </div>

                  {isComplete ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 shrink-0"
                    >
                      {series.completedCount} of {series.targetCount} Doses
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete ? 'bg-emerald-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${series.progressPercent}%` }}
                  />
                </div>

                {/* Doses */}
                <div className="mt-3 space-y-1.5">
                  {series.administeredDoses.length > 0 ? (
                    series.administeredDoses.map((doseRec) => (
                      <div
                        key={doseRec.id}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {doseRec.dose}
                          </span>
                          {doseRec.code && (
                            <Badge className="bg-teal-700 text-white text-[9px] px-1 py-0 h-3.5 font-mono">
                              {doseRec.code}
                            </Badge>
                          )}
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {doseRec.dateGiven
                              ? new Date(doseRec.dateGiven).toLocaleDateString(undefined, {
                                  dateStyle: 'medium',
                                })
                              : '—'}
                          </span>
                          {doseRec.route && doseRec.route !== 'N/A' && (
                            <span className="text-[10px] text-slate-400">({doseRec.route})</span>
                          )}
                          {doseRec.administeredBy && (
                            <span className="text-[10px] text-slate-400">· By: {doseRec.administeredBy}</span>
                          )}
                          {doseRec.facilityName && (
                            <span className="text-[10px] text-slate-400">· {doseRec.facilityName}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">No doses logged yet.</div>
                  )}

                  {!isComplete && nextDose && (
                    <div className="text-[10px] font-medium text-teal-700 dark:text-teal-400 pt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending: {nextDose.doseLabel} ({nextDose.code})
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom & Non-Standard Vaccines */}
      {groupedData.customRecords.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Syringe className="w-3.5 h-3.5 text-blue-500" />
            Additional & Custom Vaccines ({groupedData.customRecords.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedData.customRecords.map((vac) => (
              <div
                key={vac.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3"
              >
                <Syringe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{vac.vaccine}</div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Dose: <span className="font-semibold">{vac.dose}</span> ({vac.route})
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Date:{' '}
                    <span className="font-semibold">
                      {vac.dateGiven ? new Date(vac.dateGiven).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  {vac.administeredBy && (
                    <div className="text-[11px] text-slate-500">Given By: {vac.administeredBy}</div>
                  )}
                  {vac.facilityName && (
                    <div className="text-[11px] text-slate-500">Facility: {vac.facilityName}</div>
                  )}
                  {vac.notes && <div className="text-[11px] italic text-slate-500">Notes: {vac.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
