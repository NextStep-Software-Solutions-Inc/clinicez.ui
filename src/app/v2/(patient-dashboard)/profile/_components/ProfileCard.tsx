'use client'

import Link from 'next/link'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatBloodType } from '@/lib/utils'
import type { PatientBaseData } from '@/types/patient-profile-tabs'
import { VerificationStatusBadge } from './VerificationStatusBadge'

interface ProfileCardProps {
  patient: PatientBaseData
  /** When true the verification badge is a clickable link to /v2/profile/verification */
  isOwner?: boolean
}

export function ProfileCard({ patient, isOwner }: ProfileCardProps) {
  return (
    <div className="glassmorphic-card mb-6 md:mb-8">
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
          {/* Profile Picture */}
          <div className="flex-shrink-0 self-center md:self-start">
            {patient.picture ? (
              <img
                src={patient.picture}
                alt={patient.fullName}
                className="w-20 h-20 md:w-32 md:h-32 rounded-xl object-cover shadow-lg border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-2xl md:text-4xl font-bold shadow-lg border-2 border-slate-200 dark:border-slate-700">
                {patient.firstName?.[0]}{patient.lastName?.[0]}
              </div>
            )}
          </div>

          {/* Patient Info */}
          <div className="flex-grow w-full">
            <div className="mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  {patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}
                </h2>
                {isOwner ? (
                  <Link href="/v2/profile/verification" className="hover:opacity-80 transition-opacity">
                    <VerificationStatusBadge status={patient.verificationStatus} />
                  </Link>
                ) : (
                  <VerificationStatusBadge status={patient.verificationStatus} />
                )}
              </div>
              {patient.nickname && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">"{patient.nickname}"</p>
              )}
              {patient.caseNumber && (
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">Patient ID: {patient.caseNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-6">
              <div className="flex flex-col gap-0.5 md:gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Age</p>
                <p className="text-base md:text-xl font-semibold text-slate-900 dark:text-white">
                  {patient.age} <span className="text-xs md:text-sm font-normal">yrs</span>
                </p>
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Blood Type</p>
                <p className="text-lg md:text-2xl font-bold text-red-500">{formatBloodType(patient.bloodType) || 'N/A'}</p>
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Clinic</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-slate-400 dark:text-slate-500 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        The primary healthcare facility where this patient is registered and receives care.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {patient.clinic?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
