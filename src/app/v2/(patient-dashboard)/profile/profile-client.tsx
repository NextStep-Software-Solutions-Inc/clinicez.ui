'use client'

import { useState, useMemo } from 'react'
import {
  ClipboardList,
  MapPin,
  Phone,
  AlertTriangle,
  Syringe,
  Accessibility,
  Stethoscope,
  Activity,
  FlaskConical,
  Baby,
  Ruler,
  Heart,
  FileText,
} from 'lucide-react'
import type { PatientBaseData } from '@/types/patient-profile-tabs'
import { getTabBadge } from './_lib/tab-badges'
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
   * Clerk userId of the patient whose tab data should be loaded.
   * When omitted the authenticated user's own data is loaded (own profile).
   * Pass this when clinic staff view a specific patient's profile so that
   * the lazy-loaded tabs fetch that patient's records, not the viewer's.
   */
  patientUserId?: string
}

const PROFILE_TABS = [
  { id: 'overview',     label: 'Overview',           icon: ClipboardList },
  { id: 'addresses',    label: 'Addresses',           icon: MapPin },
  { id: 'contacts',     label: 'Contacts',            icon: Phone },
  { id: 'allergies',    label: 'Allergies',           icon: AlertTriangle },
  { id: 'vaccinations', label: 'Vaccinations',        icon: Syringe },
  { id: 'disabilities', label: 'Disabilities',        icon: Accessibility },
  { id: 'medical',      label: 'Medical Profile',     icon: Stethoscope },
  { id: 'vitals',       label: 'Vital Signs',         icon: Activity },
  { id: 'exams',        label: 'Physical Exams',      icon: FlaskConical },
  { id: 'obgyn',        label: 'OB/GYN',              icon: Baby },
  { id: 'pediatric',    label: 'Pediatric',           icon: Ruler },
  { id: 'lifestyle',    label: 'Lifestyle & Social',  icon: Heart },
  { id: 'insurance',    label: 'Insurance & Docs',    icon: FileText },
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
  patientUserId,
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
    <div className="w-full pt-2">
      {/* Optional custom header (used by clinic staff dashboards) */}
      {headerSlot != null && headerSlot}
      <div className="pb-24">
        <ProfileCard patient={patient} isOwner={!patientUserId} />

        <div className="sticky top-14 z-[15] -mx-4 px-4 pt-1 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <TabNav
            tabs={[...PROFILE_TABS]}
            activeTab={activeTab}
            badges={tabBadges}
            onTabChange={(id) => setActiveTab(id as ProfileTabId)}
          />
        </div>

        {/* Tab content is fetched lazily — each tab loads its own data on first visit */}
        <TabContent tab={activeTab} userId={patientUserId} />

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
