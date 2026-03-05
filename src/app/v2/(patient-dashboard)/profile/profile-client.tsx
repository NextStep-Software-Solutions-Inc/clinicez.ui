'use client'

import { useState, useMemo } from 'react'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { getTabBadge } from './_lib/tab-badges'
import { ProfileHeader } from './_components/ProfileHeader'
import { ProfileCard } from './_components/ProfileCard'
import { TabNav } from './_components/TabNav'
import { FloatingActions } from './_components/FloatingActions'
import { OverviewTab } from './_components/tabs/OverviewTab'
import { MedicalTab } from './_components/tabs/MedicalTab'
import { VitalsTab } from './_components/tabs/VitalsTab'
import { ExamsTab } from './_components/tabs/ExamsTab'
import { ObGynTab } from './_components/tabs/ObGynTab'
import { PediatricTab } from './_components/tabs/PediatricTab'
import { AddressesTab } from './_components/tabs/AddressesTab'
import { ContactsTab } from './_components/tabs/ContactsTab'
import { LifestyleTab } from './_components/tabs/LifestyleTab'
import { AllergiesTab } from './_components/tabs/AllergiesTab'
import { VaccinationsTab } from './_components/tabs/VaccinationsTab'
import { DisabilitiesTab } from './_components/tabs/DisabilitiesTab'
import { InsuranceTab } from './_components/tabs/InsuranceTab'

interface ProfileClientProps {
  patient: SerializedPatientHealthRecordsResponse
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
}

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'addresses', label: 'Addresses', icon: '📍' },
  { id: 'contacts', label: 'Contacts', icon: '🆘' },
  { id: 'allergies', label: 'Allergies', icon: '⚠️' },
  { id: 'vaccinations', label: 'Vaccinations', icon: '💉' },
  { id: 'disabilities', label: 'Disabilities', icon: '♿' },
  { id: 'medical', label: 'Medical Profile', icon: '🏥' },
  { id: 'vitals', label: 'Vital Signs', icon: '❤️' },
  { id: 'exams', label: 'Physical Exams', icon: '🔍' },
  { id: 'obgyn', label: 'OB/GYN', icon: '👶' },
  { id: 'pediatric', label: 'Pediatric', icon: '📏' },
  { id: 'lifestyle', label: 'Lifestyle & Social', icon: '👤' },
  { id: 'insurance', label: 'Insurance & Docs', icon: '📄' },
] as const

type ProfileTabId = typeof PROFILE_TABS[number]['id']

const TAB_CONTENT: Record<ProfileTabId, (patient: SerializedPatientHealthRecordsResponse) => React.ReactNode> = {
  overview:     (p) => <OverviewTab patient={p} />,
  medical:      (p) => <MedicalTab patient={p} />,
  vitals:       (p) => <VitalsTab patient={p} />,
  exams:        (p) => <ExamsTab patient={p} />,
  obgyn:        (p) => <ObGynTab patient={p} />,
  pediatric:    (p) => <PediatricTab patient={p} />,
  addresses:    (p) => <AddressesTab patient={p} />,
  contacts:     (p) => <ContactsTab patient={p} />,
  lifestyle:    (p) => <LifestyleTab patient={p} />,
  allergies:    (p) => <AllergiesTab patient={p} />,
  vaccinations: (p) => <VaccinationsTab patient={p} />,
  disabilities: (p) => <DisabilitiesTab patient={p} />,
  insurance:    (p) => <InsuranceTab patient={p} />,
}

export default function ProfileClient({
  patient,
  headerSlot,
  editProfileHref,
  filesHref,
  filesButtonLabel = 'My Files',
  appointmentsHref,
  downloadPHRHref = '/api/phr/patient',
  aiInsightConfig,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabBadges = useMemo(
    () => Object.fromEntries(PROFILE_TABS.map(t => [t.id, getTabBadge(t.id, patient)])) as Record<ProfileTabId, ReturnType<typeof getTabBadge>>,
    [patient]
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
          onTabChange={setActiveTab}
        />

        {TAB_CONTENT[activeTab as ProfileTabId]?.(patient)}

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
