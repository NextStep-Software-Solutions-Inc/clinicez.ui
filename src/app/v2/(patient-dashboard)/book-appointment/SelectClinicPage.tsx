'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, ChevronRight } from 'lucide-react'
import { getPatientClinicsAction } from '@/actions/patient/patient-files.action'

type PatientClinic = { id: number; clinicUid: string; name: string; logo: string | null }

export default function SelectClinicPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<PatientClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getPatientClinicsAction()
      .then((result) => {
        if (result.status && result.data) {
          setClinics(result.data)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSelectClinic = (clinicUid: string) => {
    router.push(`/v2/book-appointment?clinic=${clinicUid}`)
  }

  return (
    <div className="px-4 py-4">
      {/* Section header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a Clinic</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the clinic you want to book at</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : clinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No clinics found</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">You are not registered at any clinic yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clinics.map((clinic) => (
            <button
              key={clinic.clinicUid}
              type="button"
              onClick={() => handleSelectClinic(clinic.clinicUid)}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 text-left hover:border-teal-300 dark:hover:border-teal-700 transition-colors active:scale-[0.99]"
            >
              {/* Logo or initials badge */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 overflow-hidden">
                {clinic.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {clinic.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{clinic.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tap to book an appointment</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
