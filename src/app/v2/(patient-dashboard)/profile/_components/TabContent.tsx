'use client'

import { usePatientTab } from '@/hooks/use-patient-tab'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'
import { OverviewTab }     from './tabs/OverviewTab'
import { MedicalTab }      from './tabs/MedicalTab'
import { VitalsTab }       from './tabs/VitalsTab'
import { ExamsTab }        from './tabs/ExamsTab'
import { ObGynTab }        from './tabs/ObGynTab'
import { AddressesTab }    from './tabs/AddressesTab'
import { ContactsTab }     from './tabs/ContactsTab'
import { LifestyleTab }    from './tabs/LifestyleTab'
import { AllergiesTab }    from './tabs/AllergiesTab'
import { VaccinationsTab } from './tabs/VaccinationsTab'
import { DisabilitiesTab } from './tabs/DisabilitiesTab'
import { InsuranceTab }    from './tabs/InsuranceTab'
import { NcdQuestionnaireTab } from './tabs/ncd-questionnaire-tab'

// ---------------------------------------------------------------------------
// Skeleton shown while the server action is in flight
// ---------------------------------------------------------------------------
export function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glassmorphic-card p-6">
        <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
          ))}
        </div>
      </div>
      <div className="glassmorphic-card p-6">
        <div className="h-5 w-1/4 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Factory — creates a loader for any tab.
// Does NOT use suspense:true to avoid "setState during render" errors caused
// by Next.js router state updates when a server action is invoked in the
// SWR fetcher during the Suspense render phase.
// ---------------------------------------------------------------------------
function createTabLoader<T extends keyof PatientTabDataMap>(
  tabId: T,
  TabComponent: React.ComponentType<{ data: PatientTabDataMap[T], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>,
): React.ComponentType<{ userId?: string, patientId?: number, clinicPatientId?: number | null, isClinicMode?: boolean }> {
  function TabLoader({ userId, patientId, clinicPatientId, isClinicMode = false }: { userId?: string, patientId?: number, clinicPatientId?: number | null, isClinicMode?: boolean }) {
    const { data, isLoading } = usePatientTab(tabId, { suspense: false, userId })
    if (isLoading) return <TabSkeleton />
    if (!data) return null
    return <TabComponent data={data as PatientTabDataMap[T]} isClinicMode={isClinicMode} patientId={patientId} clinicPatientId={clinicPatientId} />
  }
  TabLoader.displayName = `${String(tabId)}TabLoader`
  return TabLoader
}

// ---------------------------------------------------------------------------
// Map of tab id → lazy loader component
// ---------------------------------------------------------------------------
const TAB_LOADERS: Record<keyof PatientTabDataMap, React.ComponentType<{ userId?: string, patientId?: number, clinicPatientId?: number | null, isClinicMode?: boolean }>> = {
  overview:     createTabLoader('overview',     OverviewTab as unknown as React.ComponentType<{ data: PatientTabDataMap['overview'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  medical:      createTabLoader('medical',      MedicalTab as unknown as React.ComponentType<{ data: PatientTabDataMap['medical'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  vitals:       createTabLoader('vitals',       VitalsTab as unknown as React.ComponentType<{ data: PatientTabDataMap['vitals'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  exams:        createTabLoader('exams',        ExamsTab as unknown as React.ComponentType<{ data: PatientTabDataMap['exams'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  obgyn:        createTabLoader('obgyn',        ObGynTab as unknown as React.ComponentType<{ data: PatientTabDataMap['obgyn'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  addresses:    createTabLoader('addresses',    AddressesTab as unknown as React.ComponentType<{ data: PatientTabDataMap['addresses'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  contacts:     createTabLoader('contacts',     ContactsTab as unknown as React.ComponentType<{ data: PatientTabDataMap['contacts'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  lifestyle:    createTabLoader('lifestyle',    LifestyleTab as unknown as React.ComponentType<{ data: PatientTabDataMap['lifestyle'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  allergies:    createTabLoader('allergies',    AllergiesTab as unknown as React.ComponentType<{ data: PatientTabDataMap['allergies'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  vaccinations: createTabLoader('vaccinations', VaccinationsTab as unknown as React.ComponentType<{ data: PatientTabDataMap['vaccinations'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  disabilities: createTabLoader('disabilities', DisabilitiesTab as unknown as React.ComponentType<{ data: PatientTabDataMap['disabilities'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  insurance:    createTabLoader('insurance',    InsuranceTab as unknown as React.ComponentType<{ data: PatientTabDataMap['insurance'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
  ncdQuestionnaire: createTabLoader('ncdQuestionnaire', NcdQuestionnaireTab as unknown as React.ComponentType<{ data: PatientTabDataMap['ncdQuestionnaire'], isClinicMode: boolean, patientId?: number, clinicPatientId?: number | null }>),
}

// ---------------------------------------------------------------------------
// Public component used by ProfileClient
// ---------------------------------------------------------------------------
interface TabContentProps {
  tab: keyof PatientTabDataMap
  userId?: string
  patientId?: number
  clinicPatientId?: number | null
  isClinicMode?: boolean
}

export function TabContent({ tab, userId, patientId, clinicPatientId, isClinicMode = false }: TabContentProps) {
  const Loader = TAB_LOADERS[tab]
  return <Loader userId={userId} patientId={patientId} clinicPatientId={clinicPatientId} isClinicMode={isClinicMode} />
}
