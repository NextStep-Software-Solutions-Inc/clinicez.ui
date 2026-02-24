'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClinicPatientPageHeaderProps {
  clinicUid: string
  patientId: number
  patientName: string
  /** 'view' shows: Patients > Patient Name (with prominent Appointments & Consultations button)
   *  'edit' shows:  Patients > Patient Name > Edit Profile
   *  'consultations' shows: Patients > Patient Name > Consultations
   *  'appointments-consultations' shows: Patients > Patient Name > Appointments & Consultations */
  mode: 'view' | 'edit' | 'consultations' | 'appointments-consultations'
}

export function ClinicPatientPageHeader({
  clinicUid,
  patientId,
  patientName,
  mode,
}: ClinicPatientPageHeaderProps) {
  return (
    <div className="sticky top-12 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 px-6 sm:px-8 py-4 -mx-6 sm:-mx-8">
      <div className="flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-base min-w-0">
          <Link
            href={`/v2/clinic/${clinicUid}/patients`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            Patients
          </Link>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />

          {mode === 'edit' ? (
            <>
              <Link
                href={`/v2/clinic/${clinicUid}/patients/${patientId}`}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {patientName}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="text-foreground font-semibold">Edit Profile</span>
            </>
          ) : mode === 'consultations' ? (
            <>
              <Link
                href={`/v2/clinic/${clinicUid}/patients/${patientId}`}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {patientName}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="text-foreground font-semibold">Consultations</span>
            </>
          ) : mode === 'appointments-consultations' ? (
            <>
              <Link
                href={`/v2/clinic/${clinicUid}/patients/${patientId}`}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {patientName}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="text-foreground font-semibold">Appointments &amp; Consultations</span>
            </>
          ) : (
            <span className="text-foreground font-semibold truncate">{patientName}</span>
          )}
        </nav>

        {/* Action button – shown on the profile view page */}
        {mode === 'view' && (
          <Link href={`/v2/clinic/${clinicUid}/patients/${patientId}/appointments-consultations`}>
            <Button size="sm" className="gap-2 h-9 px-4 text-sm shrink-0">
              <ClipboardList className="h-4 w-4" />
              Appointments &amp; Consultations
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
