'use client'

import { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react'
import {
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  MinusCircle,
  User,
  MapPin,
  Phone,
  AlertTriangle,
  Syringe,
  Accessibility,
  Activity,
  ClipboardList,
  Baby,
  Ruler,
  Stethoscope,
  Scissors,
  Users,
  FlaskConical,
  Building,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  mapPersonalHistoryToFormInput,
  mapPatientDataToDemographicsFormInput,
  mapVitalSignToFormInput,
  mapPediatricMeasurementToFormInput,
  mapPhysicalExaminationToFormInput,
  convertVitalSignsToDateObjects,
  convertPediatricMeasurementsToDateObjects,
} from '@/lib/mappers/health-records-mappers'
import type {
  DemographicsFormInput,
  VitalSignFormInput,
  PersonalHistoryFormInput,
  PediatricMeasurementFormInput,
  PhysicalExaminationFormInput,
  AllergyFormInput,
  EmergencyContactFormInput,
  AddressFormInput,
} from '@/schemas'
import {
  DemographicsEditForm,
  VitalSignEditForm,
  PersonalHistoryEditForm,
  ObGyneHistoryEditForm,
  PediatricMeasurementEditForm,
  MedicalConditionsEditForm,
  FamilyMedicalHistoryEditForm,
  PhysicalExaminationEditForm,
  PhilHealthRecordEditForm,
  AllergyEditForm,
  EmergencyContactEditForm,
  AddressEditForm,
  VaccinationEditForm,
  DisabilitiesEditForm,
  ProfilePictureUpload,
  SurgicalHistoryEditForm,
} from '@/components/health-records'
import type { PatientHealthRecordsResponse } from '@/types/patient-profile'
import './edit-profile.css'

/**
 * Open/Closed: add new sections only to the `sections` array.
 * `handleSaveAll` derives its behaviour automatically from `saveType`.
 *  - 'batch' → requires an explicit Save All trigger; must provide a saveRef
 *  - 'auto'  → persists when the user confirms each item (add/remove); not included in Save All
 */
type Section = {
  id: string
  label: string
  icon: LucideIcon
  ref: React.RefObject<HTMLDivElement | null>
} & (
  | { saveType: 'auto' }
  | {
      saveType: 'batch'
      saveRef: React.MutableRefObject<SaveRefHandle | null>
      /** Called by the form whenever its dirty state changes — drives sticky bar visibility */
      onDirtyChange: (isDirty: boolean) => void
    }
)

interface LoadedSections {
  [key: string]: boolean
}

interface EditProfileClientProps {
  initialData: PatientHealthRecordsResponse | null
  onDataRefresh?: (data: PatientHealthRecordsResponse) => void
  /** undefined = render default sticky header; null = hide header entirely; ReactNode = render custom header */
  headerSlot?: React.ReactNode
  /** Override the data-refresh function called after each section save. Defaults to getPatientHealthRecords() (authed user). */
  refreshFn?: () => Promise<PatientHealthRecordsResponse | null>
}

type SaveRefHandle = { submit: () => Promise<void>; hasChanges: boolean }

type SaveAllStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'no-changes'

interface SaveAllItem {
  id: string
  label: string
  icon: LucideIcon
  status: SaveAllStatus
  error?: string
}

/** Suspense fallback — defined at module level so React preserves its identity across re-renders */
function FormLoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-3/4 animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-full animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-5/6 animate-shimmer"></div>
      <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded mt-6 animate-shimmer"></div>
    </div>
  )
}

/**
 * Client-side profile editor component
 * Handles all interactive features: navigation, state management, data mutations
 * Server component (page.tsx) handles data fetching and initial load
 */
export function EditProfileClient({ initialData, onDataRefresh, headerSlot, refreshFn }: EditProfileClientProps) {
  const [activeSection, setActiveSection] = useState('demographics')
  const [patientData, setPatientData] = useState<PatientHealthRecordsResponse | null>(initialData)
  const [loadedSections, setLoadedSections] = useState<LoadedSections>({
    demographics: true,
    'vital-signs': true,
    'personal-history': true,
    'ob-gyne': true,
    pediatric: true,
    medical: true,
    surgical: true,
    family: true,
    examination: true,
    philhealth: true,
    allergies: true,
    'emergency-contacts': true,
    addresses: true,
    vaccinations: true,
    disabilities: true,
  })

  // Create refs for all sections
  const demographicsRef = useRef<HTMLDivElement>(null)
  const vitalSignsRef = useRef<HTMLDivElement>(null)
  const personalHistoryRef = useRef<HTMLDivElement>(null)
  const obGyneRef = useRef<HTMLDivElement>(null)
  const pediatricRef = useRef<HTMLDivElement>(null)
  const medicalRef = useRef<HTMLDivElement>(null)
  const familyRef = useRef<HTMLDivElement>(null)
  const examinationRef = useRef<HTMLDivElement>(null)
  const philhealthRef = useRef<HTMLDivElement>(null)
  const allergiesRef = useRef<HTMLDivElement>(null)
  const emergencyContactsRef = useRef<HTMLDivElement>(null)
  const addressesRef = useRef<HTMLDivElement>(null)
  const vaccinationsRef = useRef<HTMLDivElement>(null)
  const disabilitiesRef = useRef<HTMLDivElement>(null)
  const surgicalRef = useRef<HTMLDivElement>(null)

  // Save refs for batch-save forms (forms with a single "Save Changes" button)
  const demographicsSaveRef = useRef<SaveRefHandle | null>(null)
  const vitalSignsSaveRef = useRef<SaveRefHandle | null>(null)
  const personalHistorySaveRef = useRef<SaveRefHandle | null>(null)
  const obGyneSaveRef = useRef<SaveRefHandle | null>(null)
  const pediatricSaveRef = useRef<SaveRefHandle | null>(null)
  const medicalSaveRef = useRef<SaveRefHandle | null>(null)
  const familySaveRef = useRef<SaveRefHandle | null>(null)
  const examinationSaveRef = useRef<SaveRefHandle | null>(null)
  const philhealthSaveRef = useRef<SaveRefHandle | null>(null)

  // Save All dialog state
  const [saveAllOpen, setSaveAllOpen] = useState(false)
  const [saveAllItems, setSaveAllItems] = useState<SaveAllItem[]>([])
  const [isSavingAll, setIsSavingAll] = useState(false)

  // Track which batch sections have unsaved changes (drives sticky bar visibility)
  const dirtyMap = useRef(new Map<string, boolean>())
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const onSectionDirtyChange = useCallback((sectionId: string, isDirty: boolean) => {
    dirtyMap.current.set(sectionId, isDirty)
    setHasPendingChanges([...dirtyMap.current.values()].some(Boolean))
  }, [])

  const sections: Section[] = useMemo(
    () => [
      { id: 'demographics', label: 'Demographics', icon: User, ref: demographicsRef, saveType: 'batch', saveRef: demographicsSaveRef, onDirtyChange: (d) => onSectionDirtyChange('demographics', d) },
      { id: 'addresses', label: 'Addresses', icon: MapPin, ref: addressesRef, saveType: 'auto' },
      { id: 'emergency-contacts', label: 'Contacts', icon: Phone, ref: emergencyContactsRef, saveType: 'auto' },
      { id: 'allergies', label: 'Allergies', icon: AlertTriangle, ref: allergiesRef, saveType: 'auto' },
      { id: 'vaccinations', label: 'Vaccinations', icon: Syringe, ref: vaccinationsRef, saveType: 'auto' },
      { id: 'disabilities', label: 'Disabilities', icon: Accessibility, ref: disabilitiesRef, saveType: 'auto' },
      { id: 'vital-signs', label: 'Vitals', icon: Activity, ref: vitalSignsRef, saveType: 'batch', saveRef: vitalSignsSaveRef, onDirtyChange: (d) => onSectionDirtyChange('vital-signs', d) },
      { id: 'personal-history', label: 'History', icon: ClipboardList, ref: personalHistoryRef, saveType: 'batch', saveRef: personalHistorySaveRef, onDirtyChange: (d) => onSectionDirtyChange('personal-history', d) },
      { id: 'ob-gyne', label: 'OB/GYN', icon: Baby, ref: obGyneRef, saveType: 'batch', saveRef: obGyneSaveRef, onDirtyChange: (d) => onSectionDirtyChange('ob-gyne', d) },
      { id: 'pediatric', label: 'Pediatric', icon: Ruler, ref: pediatricRef, saveType: 'batch', saveRef: pediatricSaveRef, onDirtyChange: (d) => onSectionDirtyChange('pediatric', d) },
      { id: 'medical', label: 'Conditions', icon: Stethoscope, ref: medicalRef, saveType: 'batch', saveRef: medicalSaveRef, onDirtyChange: (d) => onSectionDirtyChange('medical', d) },
      { id: 'surgical', label: 'Surgical', icon: Scissors, ref: surgicalRef, saveType: 'auto' },
      { id: 'family', label: 'Family', icon: Users, ref: familyRef, saveType: 'batch', saveRef: familySaveRef, onDirtyChange: (d) => onSectionDirtyChange('family', d) },
      { id: 'examination', label: 'Exam', icon: FlaskConical, ref: examinationRef, saveType: 'batch', saveRef: examinationSaveRef, onDirtyChange: (d) => onSectionDirtyChange('examination', d) },
      { id: 'philhealth', label: 'PhilHealth', icon: Building, ref: philhealthRef, saveType: 'batch', saveRef: philhealthSaveRef, onDirtyChange: (d) => onSectionDirtyChange('philhealth', d) },
    ],
    [onSectionDirtyChange],
  )

  // Intersection Observer - track active section based on what's in view
  useEffect(() => {
    if (typeof window === 'undefined' || !patientData) return

    // Setup observer with adjusted margins for sticky header
    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -66% 0px', // Adjusted for sticky header height
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Get all intersecting sections sorted by position
      const intersecting = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const aRect = a.target.getBoundingClientRect()
          const bRect = b.target.getBoundingClientRect()
          return aRect.top - bRect.top
        })

      // Set active to the topmost intersecting section
      if (intersecting.length > 0) {
        const topmost = intersecting[0]
        setActiveSection(topmost.target.id)
      }
    }

    let observer: IntersectionObserver | null = null
    const timeoutIds: NodeJS.Timeout[] = []

    const setupObserver = (attempt = 1) => {
      if (!observer) {
        observer = new IntersectionObserver(observerCallback, observerOptions)
      }

      // Count how many refs are actually attached to DOM
      const attachedRefs = sections.filter((s) => s.ref.current).length

      if (attachedRefs === 0 && attempt < 5) {
        // If no refs are attached yet, try again with exponential backoff
        timeoutIds.push(setTimeout(() => setupObserver(attempt + 1), attempt * 150))
        return
      }

      // Observe all section refs that are in DOM
      sections.forEach((section) => {
        if (section.ref.current && observer) {
          observer.observe(section.ref.current)
        }
      })

      // Manually detect current visible section
      let foundActive = false
      sections.forEach((section) => {
        if (section.ref.current && !foundActive) {
          const rect = section.ref.current.getBoundingClientRect()
          // Adjusted detection with sticky header in mind
          if (rect.top >= -120 && rect.top < window.innerHeight - (window.innerHeight * 0.66)) {
            setActiveSection(section.id)
            foundActive = true
          }
        }
      })

      // If no section is in view, default to first section
      if (!foundActive) {
        setActiveSection('demographics')
      }
    }

    // Initial setup with multiple attempts to handle Suspense rendering
    setupObserver()
    timeoutIds.push(setTimeout(() => setupObserver(), 200))
    timeoutIds.push(setTimeout(() => setupObserver(), 500))
    timeoutIds.push(setTimeout(() => setupObserver(), 1000))

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id))
      if (observer) {
        observer.disconnect()
      }
    }
  }, [sections, patientData])

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId)
      if (section?.ref.current) {
        // Mark section as loaded immediately when tab is clicked
        setLoadedSections((prev) => ({
          ...prev,
          [sectionId]: true,
        }))
        // Set active section immediately when tab is clicked
        setActiveSection(sectionId)
        section.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [sections],
  )

  // Auto-scroll the active tab button into view in the nav strip whenever the active section changes
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.querySelectorAll<HTMLButtonElement>(`[data-tab-id="${activeSection}"]`).forEach((btn) => {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    })
  }, [activeSection])

  // Memoize mapped form data — only recompute when patientData changes, not on every scroll / activeSection update
  const demographicsData = useMemo(
    () => mapPatientDataToDemographicsFormInput(patientData),
    [patientData],
  )

  const vitalSignData = useMemo(
    () => mapVitalSignToFormInput(patientData?.latestVitals),
    [patientData],
  )

  const personalHistoryData = useMemo(
    () => mapPersonalHistoryToFormInput(patientData?.personalHistory),
    [patientData],
  )

  const pediatricData = useMemo(
    () => mapPediatricMeasurementToFormInput(patientData?.pediatricMeasurements),
    [patientData],
  )

  const physicalExaminationData = useMemo(
    () => mapPhysicalExaminationToFormInput(patientData?.physicalExaminations),
    [patientData],
  )

  // Memoize PhilHealth currentData to prevent unnecessary re-renders and useEffect re-triggers in child component
  const philHealthCurrentData = useMemo(
    () => {
      const record = patientData?.philHealthRecords?.[0]
      if (!record) return undefined
      
      // Access the included PhilHealthDependents from Prisma relations
      const recordWithDependents = record as typeof record & { PhilHealthDependents?: any[] }
      
      return {
        pin: record.pin,
        tin: record.tin || undefined,
        philSysId: record.philSysId || undefined,
        memberTypeId: record.memberTypeId || undefined,
        photoUrl: record.photoUrl || undefined,
        dependents: recordWithDependents.PhilHealthDependents || [],
        id: record.id,
      }
    },
    [patientData?.philHealthRecords],
  )

  const handleSuccess = useCallback(async () => {
    // Fetch fresh data after mutation
    try {
      let result: PatientHealthRecordsResponse | null = null
      if (refreshFn) {
        result = await refreshFn()
      } else {
        const { getPatientHealthRecords } = await import('@/actions/patient-profile/get-patient-health-records')
        result = (await getPatientHealthRecords()) as PatientHealthRecordsResponse | null
      }
      if (result) {
        setPatientData(result)
        onDataRefresh?.(result)
      }
    } catch (error) {
      console.error('Failed to refresh patient data:', error)
    }
  }, [refreshFn, onDataRefresh])

  // Consolidated "Save All" — derives items directly from the sections array (OCP: add new
  // sections only to the sections array above; this function requires no changes).
  const handleSaveAll = useCallback(async () => {
    // Build initial status from batch sections only — auto-save sections persist on each user action
    const initialItems: SaveAllItem[] = sections
      .filter((section): section is typeof section & { saveType: 'batch' } => section.saveType === 'batch')
      .map((section) => ({
        id: section.id,
        label: section.label,
        icon: section.icon,
        status: (section.saveRef.current?.hasChanges ? 'pending' : 'no-changes') as SaveAllStatus,
      }))

    setSaveAllItems(initialItems)
    setSaveAllOpen(true)
    setIsSavingAll(true)

    // Process each batch section sequentially
    for (const section of sections) {
      if (section.saveType !== 'batch') continue
      const handle = section.saveRef.current
      if (!handle?.hasChanges) continue

      setSaveAllItems((prev) =>
        prev.map((i) => (i.id === section.id ? { ...i, status: 'saving' } : i))
      )

      try {
        await handle.submit()
        setSaveAllItems((prev) =>
          prev.map((i) => (i.id === section.id ? { ...i, status: 'saved' } : i))
        )
      } catch (err) {
        console.error(`[SaveAll] Failed to save section "${section.id}":`, err)
        setSaveAllItems((prev) =>
          prev.map((i) => (i.id === section.id ? { ...i, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' } : i))
        )
      }
    }

    setIsSavingAll(false)
  }, [sections])

  //   'top-14' when headerSlot=null (below MobileHeader)
  //   'top-28' when a custom headerSlot is provided (below nav + breadcrumb)
  const makeSectionNav = (topClass: string) => (
    <div className={`sticky ${topClass} z-[25] backdrop-blur-sm bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/30 dark:border-slate-800/30 mb-6 md:mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-2 md:py-3`}>
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto scroll-smooth pb-1 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                data-tab-id={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-2xl font-medium text-xs md:text-sm transition-all shrink-0 flex items-center justify-center gap-1.5 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                {section.label}
              </button>
            ))}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-white/80 dark:from-slate-950/80 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-white/80 dark:from-slate-950/80 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  )

  if (!patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Unable to load profile data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* custom header slot if provided */}
      {headerSlot != null && headerSlot}
      {/* Section nav - always shown */}
      {makeSectionNav('top-14')}

      {/* Containerized Content */}
      <div className="max-w-6xl mx-auto">
        {/* Vertically Continuous Sections */}
        <div className="space-y-8">
          {/* Demographics Section */}
          <div ref={sections[0].ref} id="demographics" className="scroll-mt-32 opacity-0 animate-fade-in">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your basic demographic details</p>
                </div>
              </div>
              {loadedSections['demographics'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <DemographicsEditForm
                    userId={patientData.userId}
                    currentPicture={patientData.picture}
                    hidePicture={true}
                    inline={true}
                    currentData={demographicsData}
                    onSuccess={handleSuccess}
                    saveRef={demographicsSaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('demographics', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Addresses Section */}
          <div ref={sections[1].ref} id="addresses" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-100">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Addresses</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your residential addresses</p>
                </div>
              </div>
              {loadedSections['addresses'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <AddressEditForm
                    userId={patientData.userId}
                    inline={true}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Emergency Contacts Section */}
          <div ref={sections[2].ref} id="emergency-contacts" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-150">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Emergency Contacts</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Add people to contact in case of emergency</p>
                </div>
              </div>
              {loadedSections['emergency-contacts'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <EmergencyContactEditForm
                    userId={patientData.userId}
                    currentContacts={patientData.userEmergencyContacts}
                    inline={true}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Allergies Section */}
          <div ref={sections[3].ref} id="allergies" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-200">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Allergies</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your known allergies</p>
                </div>
              </div>
              {loadedSections['allergies'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <AllergyEditForm
                    userId={patientData.userId}
                    currentAllergies={patientData.userAllergies?.map(allergy => ({
                      id: allergy.id,
                      allergen: allergy.allergen,
                      reaction: allergy.reaction,
                      notes: allergy.notes,
                    })) || []}
                    inline={true}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Vaccinations Section */}
          <div ref={sections[4].ref} id="vaccinations" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-250">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Vaccination & Immunization</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Track your vaccination history</p>
                </div>
              </div>
              {loadedSections['vaccinations'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <VaccinationEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentVaccinations={patientData.userVaccinations}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Disabilities & Illnesses Section */}
          <div ref={sections[5].ref} id="disabilities" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-300">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Disabilities & Illnesses</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Document disabilities and chronic conditions</p>
                </div>
              </div>
              {loadedSections['disabilities'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <DisabilitiesEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentDisabilities={patientData.userDisabilities}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Vital Signs Section */}
          <div ref={sections[6].ref} id="vital-signs" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-350\">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Vital Signs</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Record your latest vital measurements</p>
                </div>
              </div>
              {loadedSections['vital-signs'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <VitalSignEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={vitalSignData}
                    recentVitals={convertVitalSignsToDateObjects(patientData?.vitalSigns)}
                    onSuccess={handleSuccess}
                    saveRef={vitalSignsSaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('vital-signs', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Personal History Section */}
          <div ref={sections[7].ref} id="personal-history" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-400">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Personal History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Information about your lifestyle and habits</p>
                </div>
              </div>
              {loadedSections['personal-history'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PersonalHistoryEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={personalHistoryData}
                    onSuccess={handleSuccess}
                    saveRef={personalHistorySaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('personal-history', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* OB/GYN History Section */}
          <div ref={sections[8].ref} id="ob-gyne" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-450">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">OB/GYN History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Reproductive and menstrual history information</p>
                </div>
              </div>
              {loadedSections['ob-gyne'] && (
                <>
                  {patientData.gender === 'MALE' ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-blue-800 dark:text-blue-200">This section is for female patients only.</p>
                    </div>
                  ) : (
                    <Suspense fallback={<FormLoadingFallback />}>
                      <ObGyneHistoryEditForm userId={patientData.userId} inline={true} onSuccess={handleSuccess} saveRef={obGyneSaveRef} onDirtyChange={(d) => onSectionDirtyChange('ob-gyne', d)} />
                    </Suspense>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pediatric Measurements Section */}
          <div ref={sections[9].ref} id="pediatric" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-500">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Pediatric Measurements</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Physical measurements for pediatric patients</p>
                </div>
              </div>
              {loadedSections['pediatric'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PediatricMeasurementEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={pediatricData as PediatricMeasurementFormInput}
                    onSuccess={handleSuccess}
                    saveRef={pediatricSaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('pediatric', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Medical Conditions Section */}
          <div ref={sections[10].ref} id="medical" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-550">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Medical Conditions</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your current health conditions</p>
                </div>
              </div>
              {loadedSections['medical'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <MedicalConditionsEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentConditions={patientData.medicalHistories?.map((h: typeof patientData.medicalHistories[number]) => ({
                      conditionId: h.conditionId,
                      details: h.details || undefined,
                    }))}
                    onSuccess={handleSuccess}
                    saveRef={medicalSaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('medical', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Surgical History Section */}
          <div ref={sections[11].ref} id="surgical" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-575">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Surgical History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Track your surgical procedures</p>
                </div>
              </div>
              {loadedSections['surgical'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <SurgicalHistoryEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentSurgeries={patientData.surgicalHistories}
                    onSuccess={handleSuccess}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Family Medical History Section */}
          <div ref={sections[12].ref} id="family" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-600">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Family History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Family medical history information</p>
                </div>
              </div>
              {loadedSections['family'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <FamilyMedicalHistoryEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentConditions={patientData.familyMedicalHistories?.map((h: typeof patientData.familyMedicalHistories[number]) => ({
                      conditionId: h.conditionId,
                      details: h.details || undefined,
                    }))}
                    onSuccess={handleSuccess}
                    saveRef={familySaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('family', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Physical Examination Section */}
          <div ref={sections[13].ref} id="examination" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-650">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Physical Examination</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Physical examination findings</p>
                </div>
              </div>
              {loadedSections['examination'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PhysicalExaminationEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={physicalExaminationData}
                    onSuccess={handleSuccess}
                    saveRef={examinationSaveRef}
                    onDirtyChange={(d) => onSectionDirtyChange('examination', d)}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* PhilHealth Record Section */}
          <div ref={sections[14].ref} id="philhealth" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-700">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">PhilHealth Information</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your health insurance details</p>
                </div>
              </div>
              {loadedSections['philhealth'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  {patientData.philHealthRecords?.[0] ? (
                    <PhilHealthRecordEditForm
                      userId={patientData.userId}
                      inline={true}
                      currentData={philHealthCurrentData}
                      onSuccess={handleSuccess}
                      saveRef={philhealthSaveRef}
                      onDirtyChange={(d) => onSectionDirtyChange('philhealth', d)}
                    />
                  ) : (
                    <PhilHealthRecordEditForm userId={patientData.userId} inline={true} onSuccess={handleSuccess} saveRef={philhealthSaveRef} onDirtyChange={(d) => onSectionDirtyChange('philhealth', d)} />
                  )}
                </Suspense>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Save All Changes bar — only visible when there are unsaved changes */}
      {hasPendingChanges && (
        <div className="fixed bottom-20 left-0 right-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/60 dark:border-slate-700/60 px-4 py-3 shadow-xl flex items-center">
          <div className="max-w-screen-sm mx-auto w-full flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">You have unsaved changes</p>
            <button
              onClick={() => void handleSaveAll()}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-semibold text-sm shadow-md shadow-teal-500/25 hover:shadow-lg hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Save All
            </button>
          </div>
        </div>
      )}

      {/* Save All Progress Dialog */}
      {saveAllOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSavingAll && setSaveAllOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
            {/* Dialog header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Save All Changes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isSavingAll ? 'Saving your profile sections…' : 'All sections processed'}
                </p>
              </div>
              {isSavingAll && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />}
            </div>

            {/* Checklist */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
              {saveAllItems.map((item) => {
                const ItemIcon = item.icon
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <ItemIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                    <span className="shrink-0">
                      {item.status === 'pending' && <MinusCircle className="w-4 h-4 text-slate-400" />}
                      {item.status === 'saving' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {item.status === 'saved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {item.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                      {item.status === 'no-changes' && <span className="text-xs text-slate-400 italic">No changes</span>}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            {!isSavingAll && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setSaveAllOpen(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
