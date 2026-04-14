'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, ChevronRight, CalendarPlus, Globe } from 'lucide-react'
import { getOrgAssociatedClinicOptionsAction } from '@/actions/dashboard/clinic-org-select.action'
import { getClinicsV2Action } from '@/actions/clinics/clinic.action'

type OrgClinic = { clinicUid: string; name: string; logo: string | null }
type PublicClinic = { clinicUid: string; name: string; description: string | null; logo: string | null; memberCount: number }

function ClinicCard({
  clinicUid,
  name,
  logo,
  subtitle,
  gradientFrom = 'from-teal-500',
  gradientTo = 'to-cyan-500',
  onSelect,
}: {
  clinicUid: string
  name: string
  logo: string | null
  subtitle: string
  gradientFrom?: string
  gradientTo?: string
  onSelect: (uid: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(clinicUid)}
      className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4 text-left hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all active:scale-[0.99] group"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shrink-0 overflow-hidden shadow-md`}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-extrabold text-xl">
            {name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 dark:text-white truncate text-base">{name}</p>
        <p className="text-sm text-teal-600 dark:text-teal-400 mt-0.5 font-medium">{subtitle}</p>
      </div>
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 flex items-center justify-center transition-colors shrink-0">
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
      </div>
    </button>
  )
}

export default function SelectClinicPage() {
  const router = useRouter()
  const [enrolledClinics, setEnrolledClinics] = useState<OrgClinic[]>([])
  const [publicClinics, setPublicClinics] = useState<PublicClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getOrgAssociatedClinicOptionsAction(),
      getClinicsV2Action({ isPublic: true }),
    ]).then(([orgClinics, publicResult]) => {
      setEnrolledClinics(orgClinics)

      if (publicResult.status && publicResult.data) {
        const enrolledUids = new Set(orgClinics.map((c) => c.clinicUid))
        // Filter out public clinics the patient already has access to
        setPublicClinics(publicResult.data.filter((c) => !enrolledUids.has(c.clinicUid)))
      }
    }).finally(() => setIsLoading(false))
  }, [])

  const handleSelectClinic = (clinicUid: string) => {
    router.push(`/v2/book-appointment?clinic=${clinicUid}`)
  }

  return (
    <div className="space-y-5">
      {/* Hero gradient card */}
      <div className="bg-gradient-to-br from-indigo-600 via-teal-600 to-cyan-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <CalendarPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Book an Appointment</h1>
            <p className="text-sm text-white/80 mt-0.5">Select a clinic to get started</p>
          </div>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          Choose from your registered clinics or discover public clinics accepting new patients.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          {/* Your Clinics */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              Your Clinics
            </p>
            {enrolledClinics.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                  You are not registered as a patient at any clinic yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledClinics.map((clinic) => (
                  <ClinicCard
                    key={clinic.clinicUid}
                    clinicUid={clinic.clinicUid}
                    name={clinic.name}
                    logo={clinic.logo}
                    subtitle="Book Now →"
                    onSelect={handleSelectClinic}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Discover Public Clinics */}
          {publicClinics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Discover Clinics
                </p>
                <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 px-1 -mt-2">
                Public clinics open to all patients
              </p>
              <div className="space-y-3">
                {publicClinics.map((clinic) => (
                  <ClinicCard
                    key={clinic.clinicUid}
                    clinicUid={clinic.clinicUid}
                    name={clinic.name}
                    logo={clinic.logo}
                    subtitle={clinic.memberCount > 0 ? `${clinic.memberCount} members · Book Now →` : 'Book Now →'}
                    gradientFrom="from-indigo-500"
                    gradientTo="to-violet-500"
                    onSelect={handleSelectClinic}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
