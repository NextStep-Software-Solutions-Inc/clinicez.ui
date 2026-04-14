'use client'

import Link from 'next/link'
import { formatBloodType } from '@/lib/utils'
import type { PatientBaseData } from '@/types/patient-profile-tabs'
import { VerificationStatusBadge } from './VerificationStatusBadge'
import { DownloadPHRButton } from '@/components/v2/phr/DownloadPHRButton'

interface ProfileCardProps {
  patient: PatientBaseData
  /** When true the verification badge is a clickable link to /v2/profile/verification */
  isOwner?: boolean
}

export function ProfileCard({ patient, isOwner }: ProfileCardProps) {
  const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="rounded-2xl overflow-hidden mb-5 shadow-lg">
      {/* Gradient hero band */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 pt-6 pb-8 px-5 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        {/* Avatar */}
        <div className="flex justify-center mb-3 relative z-10">
          {patient.picture ? (
            <img
              src={patient.picture}
              alt={patient.fullName}
              className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white/30">
              {initials}
            </div>
          )}
        </div>

        {/* Name + Verification */}
        <div className="text-center relative z-10">
          <h2 className="text-white text-xl font-bold leading-tight">
            {patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}
          </h2>
          {patient.nickname && (
            <p className="text-teal-100 text-sm mt-0.5">"{patient.nickname}"</p>
          )}
          <div className="flex justify-center mt-2">
            {isOwner ? (
              <Link href="/v2/profile/verification" className="hover:opacity-80 transition-opacity">
                <VerificationStatusBadge status={patient.verificationStatus} />
              </Link>
            ) : (
              <VerificationStatusBadge status={patient.verificationStatus} />
            )}
          </div>
          {patient.caseNumber && (
            <p className="text-teal-200 text-xs mt-1">ID: {patient.caseNumber}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Age</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {patient.age ?? '—'}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-0.5">yrs</span>
            </p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Blood</p>
            <p className="text-lg font-bold text-red-500 leading-tight">
              {formatBloodType(patient.bloodType) || '—'}
            </p>
          </div>
          <div className="flex flex-col items-center py-3 px-2 min-w-0">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Clinic</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-white text-center leading-snug line-clamp-2">
              {patient.clinic?.name || '—'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {isOwner && (
          <div className="flex gap-2 px-4 pb-4 pt-2">
            <Link
              href="/v2/profile/edit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold active:scale-95 transition-transform shadow-sm"
            >
              Edit Profile
            </Link>
            <DownloadPHRButton
              printHref="/api/phr/patient"
              patientName={patient.fullName}
            />
          </div>
        )}
      </div>
    </div>
  )
}

