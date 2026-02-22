'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClinicPatientPageHeaderProps {
  clinicUid: string
  patientId: number
  patientName: string
  /** 'view' shows: Patients > Patient Name
   *  'edit' shows:  Patients > Patient Name > Edit Profile
   *  'consultations' shows: Patients > Patient Name > Consultations */
  mode: 'view' | 'edit' | 'consultations'
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
          ) : (
            <span className="text-foreground font-semibold truncate">{patientName}</span>
          )}
        </nav>

        {/* Action links */}
        {mode === 'view' && (
          <Link href={`/v2/clinic/${clinicUid}/patients/${patientId}/consultations`}>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs shrink-0">
              <Stethoscope className="h-3.5 w-3.5" />
              Consultations
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
