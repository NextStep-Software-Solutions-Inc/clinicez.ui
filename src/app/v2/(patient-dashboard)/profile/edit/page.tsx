'use client'

import { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import type { PatientHealthRecordsResponse } from '@/types/patient-profile'
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
} from '@/components/health-records'

interface Section {
  id: string
  label: string
  icon: string
  ref: React.RefObject<HTMLDivElement | null>
}

interface LoadedSections {
  [key: string]: boolean
}

export default function EditProfilePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('demographics')
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
  })

  // Use SWR for data fetching and automatic revalidation
  const { data: patientData, isLoading, error, mutate } = useSWR(
    'patient-health-records',
    async () => {
      const result = await getPatientHealthRecords()
      return result
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      focusThrottleInterval: 5 * 60 * 1000,
    },
  )

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

  const sections: Section[] = useMemo(
    () => [
      { id: 'demographics', label: 'Demographics', icon: '👤', ref: demographicsRef },
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

  const handleSuccess = useCallback(async () => {
    // Revalidate SWR cache to refresh data
    await mutate()
  }, [mutate])

  // Loading fallback component for Suspense boundaries
  const FormLoadingFallback = () => (
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-3/4 animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-full animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded w-5/6 animate-shimmer"></div>
      <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded mt-6 animate-shimmer"></div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Edit Profile
            </h1>
          </div>
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Loading profile data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error instanceof Error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <p className="text-red-800 dark:text-red-200">Failed to load profile data. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors backdrop-blur-sm border border-white/20 dark:border-slate-700/20"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Edit Profile
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your health information</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Horizontal Section Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-0 -mx-4 md:-mx-8 px-4 md:px-8 scrollbar-hide mt-4">
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
        </div>
      </div>

      {/* Containerized Content */}
      <div className="max-w-4xl mx-auto">
        {/* Vertically Continuous Sections */}
        <div className="space-y-8">
          {/* Demographics Section */}
          <div
            ref={sections[0].ref}
            id="demographics"
            className="scroll-mt-32 opacity-0 animate-fade-in"
          >
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
                    inline={true}
                    currentData={{
                      firstName: patientData.firstName || '',
                      lastName: patientData.lastName || '',
                      middleName: patientData.middleName || undefined,
                      dob: patientData.dob || undefined,
                      gender: (patientData.gender as "MALE" | "FEMALE" | "OTHER" | null | undefined) || undefined,
                      bloodType: (patientData.bloodType as "O_POSITIVE" | "O_NEGATIVE" | "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | null | undefined) || undefined,
                      civilStatus: (patientData.civilStatus as "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | null | undefined) || undefined,
                      religion: patientData.religion || undefined,
                      mobile: patientData.mobile || undefined,
                      telephone: patientData.telephone || undefined,
                      placeOfBirth: patientData.placeOfBirth || undefined,
                      nationality: patientData.nationality || undefined,
                    }}
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Vital Signs Section */}
          <div
            ref={sections[1].ref}
            id="vital-signs"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-100"
          >
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Personal History Section */}
          <div
            ref={sections[2].ref}
            id="personal-history"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-200"
          >
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* OB/GYN History Section */}
          <div
            ref={sections[3].ref}
            id="ob-gyne"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-300"
          >
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl p-6 md:p-8 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">OB/GYN History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Reproductive and menstrual history information</p>
                </div>
              </div>
              {loadedSections['ob-gyne'] && (
                <Suspense fallback={<FormLoadingFallback />}>
                  <ObGyneHistoryEditForm
                    userId={patientData.userId}
                    inline={true}
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Pediatric Measurements Section */}
          <div
            ref={sections[4].ref}
            id="pediatric"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-400"
          >
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Medical Conditions Section */}
          <div
            ref={sections[5].ref}
            id="medical"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-500"
          >
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
          <div
            ref={sections[6].ref}
            id="family"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-600"
          >
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
          <div
            ref={sections[7].ref}
            id="examination"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-700"
          >
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
                    onSuccess={() => handleSuccess()}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* PhilHealth Record Section */}
          <div
            ref={sections[8].ref}
            id="philhealth"
            className="scroll-mt-32 opacity-0 animate-fade-in animation-delay-800"
          >
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
                      currentData={{
                        pin: patientData.philHealthRecords[0].pin,
                        tin: patientData.philHealthRecords[0].tin || undefined,
                        philSysId: patientData.philHealthRecords[0].philSysId || undefined,
                        memberTypeId: patientData.philHealthRecords[0].memberTypeId || undefined,
                        photoUrl: patientData.philHealthRecords[0].photoUrl || undefined,
                        dependents: patientData.philHealthRecords[0].PhilHealthDependents || [],
                        id: patientData.philHealthRecords[0].id,
                      }}
                      onSuccess={() => handleSuccess()}
                    />
                  ) : (
                    <PhilHealthRecordEditForm
                      userId={patientData.userId}
                      inline={true}
                      onSuccess={() => handleSuccess()}
                    />
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Changes are saved automatically per section
            </p>
            {patientData && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Add CSS animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-in-out forwards;
          }
          .animation-delay-100 {
            animation-delay: 0.1s;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          .animation-delay-400 {
            animation-delay: 0.4s;
          }
          .animation-delay-500 {
            animation-delay: 0.5s;
          }
          .animation-delay-600 {
            animation-delay: 0.6s;
          }
          .animation-delay-700 {
            animation-delay: 0.7s;
          }
          .animation-delay-800 {
            animation-delay: 0.8s;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  )
}
