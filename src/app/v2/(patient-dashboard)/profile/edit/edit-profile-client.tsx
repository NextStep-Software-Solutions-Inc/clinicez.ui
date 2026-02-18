'use client'

import { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
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
} from '@/components/health-records'
import type { PatientHealthRecordsResponse } from '@/types/patient-profile'
import './edit-profile.css'

interface Section {
  id: string
  label: string
  icon: string
  ref: React.RefObject<HTMLDivElement | null>
}

interface LoadedSections {
  [key: string]: boolean
}

interface EditProfileClientProps {
  initialData: PatientHealthRecordsResponse | null
  onDataRefresh?: (data: PatientHealthRecordsResponse) => void
}

/**
 * Client-side profile editor component
 * Handles all interactive features: navigation, state management, data mutations
 * Server component (page.tsx) handles data fetching and initial load
 */
export function EditProfileClient({ initialData, onDataRefresh }: EditProfileClientProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('demographics')
  const [patientData, setPatientData] = useState<PatientHealthRecordsResponse | null>(initialData)
  const [loadedSections, setLoadedSections] = useState<LoadedSections>({
    demographics: true,
    'vital-signs': true,
    'personal-history': true,
    'ob-gyne': true,
    pediatric: true,
    medical: true,
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

  const sections: Section[] = useMemo(
    () => [
      { id: 'demographics', label: 'Demographics', icon: '👤', ref: demographicsRef },
      { id: 'addresses', label: 'Addresses', icon: '📍', ref: addressesRef },
      { id: 'emergency-contacts', label: 'Contacts', icon: '🆘', ref: emergencyContactsRef },
      { id: 'allergies', label: 'Allergies', icon: '⚠️', ref: allergiesRef },
      { id: 'vaccinations', label: 'Vaccinations', icon: '💉', ref: vaccinationsRef },
      { id: 'disabilities', label: 'Disabilities', icon: '♿', ref: disabilitiesRef },
      { id: 'vital-signs', label: 'Vitals', icon: '❤️', ref: vitalSignsRef },
      { id: 'personal-history', label: 'History', icon: '📋', ref: personalHistoryRef },
      { id: 'ob-gyne', label: 'OB/GYN', icon: '👶', ref: obGyneRef },
      { id: 'pediatric', label: 'Pediatric', icon: '📏', ref: pediatricRef },
      { id: 'medical', label: 'Conditions', icon: '🏥', ref: medicalRef },
      { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', ref: familyRef },
      { id: 'examination', label: 'Exam', icon: '🔍', ref: examinationRef },
      { id: 'philhealth', label: 'PhilHealth', icon: '🏛️', ref: philhealthRef },
    ],
    [],
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

    // Also setup observer on scroll to catch intersection changes
    const handleScroll = () => {
      // Re-validate observer setup periodically during scroll
      sections.forEach((section) => {
        if (section.ref.current && observer && !observer.disconnect) {
          try {
            observer.observe(section.ref.current)
          } catch (e) {
            // Silently handle if observer is disconnected
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id))
      window.removeEventListener('scroll', handleScroll)
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

  // Lazily prepare data only for visible sections to reduce initial load
  // Data is only computed when section becomes visible, not upfront
  const getDemographicsData = useCallback(
    (): DemographicsFormInput | undefined =>
      activeSection === 'demographics' || loadedSections['demographics']
        ? mapPatientDataToDemographicsFormInput(patientData)
        : undefined,
    [patientData, activeSection, loadedSections],
  )

  const getVitalSignData = useCallback(
    (): VitalSignFormInput | undefined =>
      activeSection === 'vital-signs' || loadedSections['vital-signs']
        ? mapVitalSignToFormInput(patientData?.latestVitals)
        : undefined,
    [patientData, activeSection, loadedSections],
  )

  const getPersonalHistoryData = useCallback(
    (): PersonalHistoryFormInput | undefined =>
      activeSection === 'personal-history' || loadedSections['personal-history']
        ? mapPersonalHistoryToFormInput(patientData?.personalHistory)
        : undefined,
    [patientData, activeSection, loadedSections],
  )

  const getPediatricData = useCallback(
    (): PediatricMeasurementFormInput | undefined =>
      activeSection === 'pediatric' || loadedSections['pediatric']
        ? mapPediatricMeasurementToFormInput(patientData?.pediatricMeasurements)
        : undefined,
    [patientData, activeSection, loadedSections],
  )

  const getPhysicalExaminationData = useCallback(
    (): PhysicalExaminationFormInput | undefined =>
      activeSection === 'examination' || loadedSections['examination']
        ? mapPhysicalExaminationToFormInput(patientData?.physicalExaminations)
        : undefined,
    [patientData, activeSection, loadedSections],
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
      const { getPatientHealthRecords } = await import('@/actions/patient-profile/get-patient-health-records')
      const result = await getPatientHealthRecords()
      if (result) {
        setPatientData(result as PatientHealthRecordsResponse)
        onDataRefresh?.(result as PatientHealthRecordsResponse)
      }
    } catch (error) {
      console.error('Failed to refresh patient data:', error)
    }
  }, [onDataRefresh])

  // Loading fallback component for Suspense boundaries
  const FormLoadingFallback = () => (
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-3/4 animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-full animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-5/6 animate-shimmer"></div>
      <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded mt-6 animate-shimmer"></div>
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-slate-950/20 border-b border-slate-200/20 dark:border-slate-800/20 mb-8 -mx-8 px-8 py-4 rounded-b-3xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors backdrop-blur-sm border border-white/20 dark:border-slate-700/20"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your health information</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Horizontal Section Navigation */}
          <div className="relative mt-4">
            <div className="flex gap-2 overflow-x-auto scroll-smooth pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mt-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.4) transparent' }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/20'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
            {/* Scroll indicator gradient (right side) */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/30 dark:from-slate-950/30 to-transparent pointer-events-none rounded-r-lg"></div>
          </div>
        </div>
      </div>

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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your basic demographic details</p>
                </div>
              </div>
              {loadedSections['demographics'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <DemographicsEditForm
                    userId={patientData.userId}
                    currentPicture={patientData.picture}
                    inline={true}
                    currentData={getDemographicsData()}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Allergies</h2>
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
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Emergency Contacts</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Add people to contact in case of emergency</p>
                </div>
              </div>
              {loadedSections['emergency-contacts'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <EmergencyContactEditForm
                    userId={patientData.userId}
                    currentContacts={patientData.userEmergencyContacts}
                    inline={true}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Addresses</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your residential addresses</p>
                </div>
              </div>
              {loadedSections['addresses'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <AddressEditForm
                    userId={patientData.userId}
                    inline={true}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vaccination & Immunization</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Track your vaccination history</p>
                </div>
              </div>
              {loadedSections['vaccinations'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <VaccinationEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentVaccinations={patientData.userVaccinations}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Disabilities & Illnesses</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Document disabilities and chronic conditions</p>
                </div>
              </div>
              {loadedSections['disabilities'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <DisabilitiesEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentDisabilities={patientData.userDisabilities}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vital Signs</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Record your latest vital measurements</p>
                </div>
              </div>
              {loadedSections['vital-signs'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <VitalSignEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={getVitalSignData()}
                    recentVitals={convertVitalSignsToDateObjects(patientData?.vitalSigns)}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personal History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Information about your lifestyle and habits</p>
                </div>
              </div>
              {loadedSections['personal-history'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PersonalHistoryEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={getPersonalHistoryData()}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">OB/GYN History</h2>
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
                      <ObGyneHistoryEditForm userId={patientData.userId} inline={true} onSuccess={() => handleSuccess()} />
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pediatric Measurements</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Physical measurements for pediatric patients</p>
                </div>
              </div>
              {loadedSections['pediatric'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PediatricMeasurementEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={getPediatricData()! as PediatricMeasurementFormInput}
                    onSuccess={() => handleSuccess()}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Conditions</h2>
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Family Medical History Section */}
          <div ref={sections[11].ref} id="family" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-600">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Family History</h2>
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Physical Examination Section */}
          <div ref={sections[12].ref} id="examination" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-650">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Physical Examination</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Physical examination findings</p>
                </div>
              </div>
              {loadedSections['examination'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <PhysicalExaminationEditForm
                    userId={patientData.userId}
                    inline={true}
                    currentData={getPhysicalExaminationData()}
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* PhilHealth Record Section */}
          <div ref={sections[13].ref} id="philhealth" className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-700">
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">PhilHealth Information</h2>
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
                      onSuccess={() => handleSuccess()}
                    />
                  ) : (
                    <PhilHealthRecordEditForm userId={patientData.userId} inline={true} onSuccess={() => handleSuccess()} />
                  )}
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 rounded-lg font-medium text-sm transition-all backdrop-blur-sm border border-white/20 dark:border-slate-700/20 bg-white/20 dark:bg-slate-800/20 text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40"
          >
            ← Back to Profile
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Changes are saved automatically per section</p>
            {patientData && (
              <p className="text-xs text-slate-500 dark:text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
