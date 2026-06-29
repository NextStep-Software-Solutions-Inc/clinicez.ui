'use client'

import Link from 'next/link'
import { formatBloodType } from '@/lib/utils'
import type { PatientBaseData } from '@/types/patient-profile-tabs'
import { VerificationStatusBadge } from './VerificationStatusBadge'
import { DownloadPHRButton } from '@/components/v2/phr/DownloadPHRButton'
import { ProfileAvatarCamera } from './ProfileAvatarCamera'
import { CheckCircle2 } from 'lucide-react'

function YakapBadge({ isProfiled }: { isProfiled: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-teal-100 bg-teal-900/30 px-2 py-0.5 rounded-md border border-teal-500/30 backdrop-blur-sm ml-2">
      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Yakap {isProfiled ? 'Profiled' : 'Enlisted'}</span>
    </span>
  );
}

interface ProfileCardProps {
  patient: PatientBaseData
  /** When true the verification badge is a clickable link to /v2/profile/verification */
  isOwner?: boolean
}

export function ProfileCard({ patient, isOwner }: ProfileCardProps) {
  const initials = (`${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`).toUpperCase() || '?'
  return (
    <div className="rounded-2xl overflow-hidden mb-5 shadow-lg">
      {/* Gradient hero band */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 pt-6 pb-8 px-5 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        {/* Avatar — with camera overlay if owner */}
        <div className="flex justify-center mb-3 relative z-20">
          {isOwner ? (
            <ProfileAvatarCamera
              userId={patient.userId}
              picture={patient.picture}
              initials={initials}
            />
          ) : patient.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
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
          <h2 className="text-white text-xl font-bold leading-tight flex items-center justify-center flex-wrap gap-y-1">
            {patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}
          </h2>
          {patient.nickname && (
            <p className="text-teal-100 text-sm mt-0.5">&ldquo;{patient.nickname}&rdquo;</p>
          )}
          <div className="flex justify-center mt-2 gap-x-2">
            {patient.yakapEnlistment && (
              <YakapBadge isProfiled={!!patient.yakapEnlistment.profilingTransNo} />
            )}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-700">
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Age</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight text-center">
              {patient.detailedAge ?? '—'}
            </p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Blood</p>
            <p className="text-lg font-bold text-red-500 leading-tight">
              {formatBloodType(patient.bloodType) || '—'}
            </p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">BMI</p>
            <p className="text-lg font-bold text-emerald-500 leading-tight">
              {patient.latestBmi != null ? patient.latestBmi.toFixed(1) : '—'}
            </p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Z-Score</p>
            <p className="text-lg font-bold text-blue-500 leading-tight">
              {patient.latestZScore != null ? patient.latestZScore.toFixed(2) : '—'}
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
