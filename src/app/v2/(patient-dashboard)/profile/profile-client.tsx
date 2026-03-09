'use client'

import { useState, useMemo } from 'react'
import type { PatientBaseData, PatientTabDataMap } from '@/types/patient-profile-tabs'
import { getTabBadge } from './_lib/tab-badges'
import { ProfileHeader } from './_components/ProfileHeader'
import { ProfileCard } from './_components/ProfileCard'
import { TabNav } from './_components/TabNav'
import { TabContent } from './_components/TabContent'
import { FloatingActions } from './_components/FloatingActions'

interface ProfileClientProps {
  patient: PatientBaseData
  /** undefined = render default sticky header; null = hide header entirely; ReactNode = render custom header */
  headerSlot?: React.ReactNode
  /** undefined = use default '/v2/profile/edit'; null = hide edit button; string = navigate to that URL */
  editProfileHref?: string | null
  /** undefined = use default '/v2/patient/files'; null = hide files button; string = navigate to that URL */
  filesHref?: string | null
  /** Label for the files button. Defaults to "My Files" */
  filesButtonLabel?: string
  /** undefined = hide appointments button; string = navigate to that URL */
  appointmentsHref?: string | null
  /** URL for the PHR print page. Defaults to '/v2/patient/phr/print' */
  downloadPHRHref?: string
  /** When provided, renders the AI Patient Insight button (healthcare providers only) */
  aiInsightConfig?: { patientId: number; clinicId?: number }
  /**
   * When provided, tab content is rendered directly from this data instead of
   * fetching lazily via SWR server actions (which use currentUser()).
   * Required when a clinic staff member views a specific patient's profile so
   * the tabs show the patient's data, not the authenticated user's data.
   */
  prefetchedTabData?: PatientTabDataMap
}

const PROFILE_TABS = [
  { id: 'overview',     label: 'Overview',           icon: '📋' },
  { id: 'addresses',    label: 'Addresses',           icon: '📍' },
  { id: 'contacts',     label: 'Contacts',            icon: '🆘' },
  { id: 'allergies',    label: 'Allergies',           icon: '⚠️' },
  { id: 'vaccinations', label: 'Vaccinations',        icon: '💉' },
  { id: 'disabilities', label: 'Disabilities',        icon: '♿' },
  { id: 'medical',      label: 'Medical Profile',     icon: '🏥' },
  { id: 'vitals',       label: 'Vital Signs',         icon: '❤️' },
  { id: 'exams',        label: 'Physical Exams',      icon: '🔍' },
  { id: 'obgyn',        label: 'OB/GYN',              icon: '👶' },
  { id: 'pediatric',    label: 'Pediatric',           icon: '📏' },
  { id: 'lifestyle',    label: 'Lifestyle & Social',  icon: '👤' },
  { id: 'insurance',    label: 'Insurance & Docs',    icon: '📄' },
] as const

type ProfileTabId = typeof PROFILE_TABS[number]['id']

export default function ProfileClient({
  patient,
  headerSlot,
  editProfileHref,
  filesHref,
  filesButtonLabel = 'My Files',
  appointmentsHref,
  downloadPHRHref = '/api/phr/patient',
  aiInsightConfig,
  prefetchedTabData,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview')

  // Badge counts come from the slim base-data (no full arrays needed)
  const tabBadges = useMemo(
    () => Object.fromEntries(
      PROFILE_TABS.map(t => [t.id, getTabBadge(t.id, patient.badges)])
    ) as Record<ProfileTabId, ReturnType<typeof getTabBadge>>,
    [patient.badges],
  )

  return (
    <div className="w-full">
      {headerSlot !== null && (headerSlot ?? <ProfileHeader />)}

      <div className="max-w-6xl mx-auto pb-32">
        <ProfileCard patient={patient} />

        <TabNav
          tabs={[...PROFILE_TABS]}
          activeTab={activeTab}
          badges={tabBadges}
          onTabChange={(id) => setActiveTab(id as ProfileTabId)}
        />

        {/* Tab content is fetched lazily — each tab loads its own data on first visit */}
        <TabContent tab={activeTab} prefetchedData={prefetchedTabData} />

        <FloatingActions
          patientName={patient.fullName}
          editProfileHref={editProfileHref}
          filesHref={filesHref}
          filesButtonLabel={filesButtonLabel}
          appointmentsHref={appointmentsHref}
          downloadPHRHref={downloadPHRHref}
          aiInsightConfig={aiInsightConfig}
        />
      </div>
    </div>
  )
}
