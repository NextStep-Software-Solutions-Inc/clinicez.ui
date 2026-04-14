'use client'

import { ClipboardList } from 'lucide-react'
import {
  calculateBMI,
  calculateBodyFat,
  getBMICategory,
  getBodyFatCategory,
  generateClinicalRemarks,
} from '../../_lib/vitals-utils'
import type { OverviewTabData } from '@/types/patient-profile-tabs'

type Props = { data: OverviewTabData }

export function OverviewTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <DemographicsCard data={data} />
      <QuickStatsGrid data={data} />
      {data.latestVitals && <LatestVitalsCard data={data} />}
    </div>
  )
}

function DemographicsCard({ data }: Props) {
  return (
    <div className="glassmorphic-card p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><ClipboardList className="w-5 h-5 text-teal-500" /> Demographics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.email && <InfoCell label="Email" value={data.email} />}
        {data.mobile && <InfoCell label="Mobile" value={data.mobile} />}
        {data.telephone && <InfoCell label="Telephone" value={data.telephone} />}
        {data.dob && <InfoCell label="DOB" value={new Date(data.dob).toLocaleDateString()} />}
        {data.gender && <InfoCell label="Gender" value={data.gender} className="capitalize" />}
        {data.suffix && <InfoCell label="Suffix" value={data.suffix} />}
        {data.nickname && <InfoCell label="Nickname" value={data.nickname} />}
        {data.nationality && <InfoCell label="Nationality" value={data.nationality} />}
        {data.religion && <InfoCell label="Religion" value={data.religion} />}
      </div>
    </div>
  )
}

function QuickStatsGrid({ data }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard value={data.medicalHistoriesCount} label="Medical Conditions" color="text-blue-500" />
      <StatCard value={data.vitalSignsCount} label="Vital Records" color="text-green-500" />
      <StatCard value={data.medicalCertificatesCount} label="Certificates" color="text-purple-500" />
      <StatCard value={data.referralSlipsCount} label="Referrals" color="text-orange-500" />
    </div>
  )
}

function LatestVitalsCard({ data }: Props) {
  const vitals = data.latestVitals!
  const displayBMI = vitals.bmi ?? calculateBMI(vitals.weight, vitals.height)
  const displayBodyFat = calculateBodyFat(vitals.weight, vitals.height, data.gender)
  const clinicalRemarks = generateClinicalRemarks(vitals, data.gender)

  return (
    <div className="glassmorphic-card p-6 border border-red-200/30 dark:border-red-500/20">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-red-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Vital Signs</h3>
      </div>

      {/* Primary vitals — 3 columns */}
      <div className="grid grid-cols-3 gap-8 mb-6">
        <div className="space-y-6">
            <VitalMetric label="BP" value={vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic} / ${vitals.bpDiastolic}` : '-'} unit="mmHg" color="text-red-600 dark:text-red-400" />
            <VitalMetric label="HEIGHT" value={String(vitals.height || '-')} unit="cm" color="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-6">
            <VitalMetric label="HR" value={String(vitals.pulseRate || '-')} unit="bpm" color="text-blue-600 dark:text-blue-400" />
            <VitalMetric label="BMI" value={String(displayBMI || '-')} unit={getBMICategory(parseFloat(String(displayBMI || '0')))} color="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="space-y-6">
            <VitalMetric label="TEMP" value={String(vitals.temp || '-')} unit="°C" color="text-orange-600 dark:text-orange-400" />
            <VitalMetric
              label="BODY FAT"
              value={`${displayBodyFat || '-'}%`}
              unit={getBodyFatCategory(parseFloat(displayBodyFat || '0'), data.gender)}
              color="text-amber-600 dark:text-amber-400"
            />
        </div>
      </div>

      {/* Secondary vitals row */}
      <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-slate-300/30 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">SpO₂</p>
            {
                vitals.spo2 ? (
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{vitals.spo2}%</p>
                ) : "-"
            }
            <p className="text-xs text-slate-600 dark:text-slate-400">%</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">RR</p>
            {vitals.respRate ? (
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{vitals.respRate}</p>
            ) : "-"}
            <p className="text-xs text-slate-600 dark:text-slate-400">br/min</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">WEIGHT</p>
            {vitals.weight ? (
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{vitals.weight}kg</p>
            ) : "-"}
          </div>
      </div>

      {/* Clinical remarks */}
      {clinicalRemarks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">REMARKS</p>
          <div className="space-y-2">
            {clinicalRemarks.map((remark, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                <span className="text-lg flex-shrink-0">{remark.icon}</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{remark.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!vitals.notes && (
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-lg border border-slate-200/50 dark:border-white/10">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">NOTES</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{vitals.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

interface InfoCellProps {
  label: string
  value: string
  className?: string
}

function InfoCell({ label, value, className = '' }: InfoCellProps) {
  return (
    <div>
      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
      <p className={`text-slate-900 dark:text-white ${className}`}>{value}</p>
    </div>
  )
}

interface StatCardProps {
  value: number
  label: string
  color: string
}

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="glassmorphic-card p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  )
}

interface VitalMetricProps {
  label: string
  value: string
  unit: string
  color: string
}

function VitalMetric({ label, value, unit, color }: VitalMetricProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{unit}</p>
    </div>
  )
}
