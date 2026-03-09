'use client'

import { Suspense } from 'react'
import { usePatientTab } from '@/hooks/use-patient-tab'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'
import { OverviewTab }     from './tabs/OverviewTab'
import { MedicalTab }      from './tabs/MedicalTab'
import { VitalsTab }       from './tabs/VitalsTab'
import { ExamsTab }        from './tabs/ExamsTab'
import { ObGynTab }        from './tabs/ObGynTab'
import { PediatricTab }    from './tabs/PediatricTab'
import { AddressesTab }    from './tabs/AddressesTab'
import { ContactsTab }     from './tabs/ContactsTab'
import { LifestyleTab }    from './tabs/LifestyleTab'
import { AllergiesTab }    from './tabs/AllergiesTab'
import { VaccinationsTab } from './tabs/VaccinationsTab'
import { DisabilitiesTab } from './tabs/DisabilitiesTab'
import { InsuranceTab }    from './tabs/InsuranceTab'

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
// Factory — creates a Suspense-enabled loader for any tab.
// Eliminates 13 near-identical loader declarations with a single generic.
// ---------------------------------------------------------------------------
function createTabLoader<T extends keyof PatientTabDataMap>(
  tabId: T,
  TabComponent: React.ComponentType<{ data: PatientTabDataMap[T] }>,
): React.ComponentType {
  function TabLoader() {
    const { data } = usePatientTab(tabId, { suspense: true })
    if (!data) return null
    return <TabComponent data={data as PatientTabDataMap[T]} />
  }
  TabLoader.displayName = `${String(tabId)}TabLoader`
  return TabLoader
}

// ---------------------------------------------------------------------------
// Map of tab id → lazy loader component
// ---------------------------------------------------------------------------
const TAB_LOADERS: Record<keyof PatientTabDataMap, React.ComponentType> = {
  overview:     createTabLoader('overview',     OverviewTab),
  medical:      createTabLoader('medical',      MedicalTab),
  vitals:       createTabLoader('vitals',       VitalsTab),
  exams:        createTabLoader('exams',        ExamsTab),
  obgyn:        createTabLoader('obgyn',        ObGynTab),
  pediatric:    createTabLoader('pediatric',    PediatricTab),
  addresses:    createTabLoader('addresses',    AddressesTab),
  contacts:     createTabLoader('contacts',     ContactsTab),
  lifestyle:    createTabLoader('lifestyle',    LifestyleTab),
  allergies:    createTabLoader('allergies',    AllergiesTab),
  vaccinations: createTabLoader('vaccinations', VaccinationsTab),
  disabilities: createTabLoader('disabilities', DisabilitiesTab),
  insurance:    createTabLoader('insurance',    InsuranceTab),
}

// ---------------------------------------------------------------------------
// Public component used by ProfileClient
// ---------------------------------------------------------------------------
interface TabContentProps {
  tab: keyof PatientTabDataMap
  /**
   * When provided (e.g. clinic-staff viewing a specific patient), renders the
   * tab directly from pre-fetched data instead of lazy-loading via SWR.
   * This prevents the SWR server actions (which use currentUser()) from
   * returning the authenticated user's data instead of the patient's.
   */
  prefetchedData?: PatientTabDataMap
}

export function TabContent({ tab, prefetchedData }: TabContentProps) {
  if (prefetchedData) {
    // Render directly from pre-fetched data — no SWR needed
    const tabData = prefetchedData[tab]
    if (!tabData) return null
    switch (tab) {
      case 'overview':     return <OverviewTab     data={prefetchedData.overview} />
      case 'medical':      return <MedicalTab      data={prefetchedData.medical} />
      case 'vitals':       return <VitalsTab       data={prefetchedData.vitals} />
      case 'exams':        return <ExamsTab        data={prefetchedData.exams} />
      case 'obgyn':        return <ObGynTab        data={prefetchedData.obgyn} />
      case 'pediatric':    return <PediatricTab    data={prefetchedData.pediatric} />
      case 'addresses':    return <AddressesTab    data={prefetchedData.addresses} />
      case 'contacts':     return <ContactsTab     data={prefetchedData.contacts} />
      case 'lifestyle':    return <LifestyleTab    data={prefetchedData.lifestyle} />
      case 'allergies':    return <AllergiesTab    data={prefetchedData.allergies} />
      case 'vaccinations': return <VaccinationsTab data={prefetchedData.vaccinations} />
      case 'disabilities': return <DisabilitiesTab data={prefetchedData.disabilities} />
      case 'insurance':    return <InsuranceTab    data={prefetchedData.insurance} />
    }
  }

  const Loader = TAB_LOADERS[tab]
  return (
    <Suspense fallback={<TabSkeleton />}>
      <Loader />
    </Suspense>
  )
}
