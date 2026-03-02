'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Heart, 
  Edit2,
  BarChart3,
  List,
  FolderOpen,
  ClipboardList,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { PhilHealthRecords } from '@/components/patient-dashboard-v2/PhilHealthRecords'
import { formatBloodType } from '@/lib/utils'
import { calculateAgeInMonths, formatAge, getLengthPercentile, getWeightPercentile, getGrowthStatusColor } from '@/lib/pediatric-growth-utils'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { DownloadPHRButton } from '@/components/v2/phr/DownloadPHRButton'
import { PatientAIInsightButton } from '@/components/v2/patients/PatientAIInsightButton'

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
]

export default function ProfileClient({ patient, headerSlot, editProfileHref, filesHref, filesButtonLabel = 'My Files', appointmentsHref, downloadPHRHref = '/api/phr/patient', aiInsightConfig }: ProfileClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [vitalsViewMode, setVitalsViewMode] = useState<'list' | 'chart'>('list')
  const [pediatricViewMode, setPediatricViewMode] = useState<'list' | 'chart'>('list')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Badge status helpers
  const getTabBadge = (tabId: string): { status: string; count: number } | null => {
    switch (tabId) {
      case 'overview': {
        let incompleteCount = 0
        if (!patient.email) incompleteCount++
        if (!patient.mobile && !patient.telephone) incompleteCount++
        if (!patient.dob) incompleteCount++
        if (!patient.gender) incompleteCount++
        if (!patient.bloodType) incompleteCount++
        if (!patient.nationality) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'medical': {
        let incompleteCount = 0
        if (patient.medicalHistories.length === 0) incompleteCount++
        if (patient.familyMedicalHistories.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'vitals': {
        let incompleteCount = 0
        if (patient.vitalSigns.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'exams': {
        let incompleteCount = 0
        if (patient.physicalExaminations.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'lifestyle': {
        let incompleteCount = 0
        if (!patient.personalHistory) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'obgyn': {
        let incompleteCount = 0
        if (!patient.obGyneHistory) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'pediatric': {
        let incompleteCount = 0
        if (patient.pediatricMeasurements.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'allergies': {
        return null
      }
      case 'vaccinations': {
        let incompleteCount = 0
        if (patient.userVaccinations.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'disabilities': {
        return null
      }
      case 'addresses': {
        let incompleteCount = 0
        if (patient.userAddresses.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'contacts': {
        let incompleteCount = 0
        if (patient.userEmergencyContacts.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'insurance': {
        let incompleteCount = 0
        if (patient.philHealthRecords.length === 0) incompleteCount++
        
        const optionalDocsCount = 
          (patient.medicalCertificates?.length || 0) +
          (patient.referralSlips?.length || 0) +
          (patient.procedureHistory?.length || 0)
        
        if (incompleteCount > 0) {
          return { status: 'Incomplete', count: incompleteCount }
        } else if (optionalDocsCount > 0) {
          return { status: 'Available', count: optionalDocsCount }
        }
        return null
      }
      default:
        return null
    }
  }

  // Pre-compute all tab badges once. patient is a stable RSC prop so this only runs on initial mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabBadges = useMemo(() => Object.fromEntries(PROFILE_TABS.map(t => [t.id, getTabBadge(t.id)])) as Record<string, { status: string; count: number } | null>, [patient])

  const defaultHeader = (
    <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-50/20 via-blue-50/20 to-transparent dark:from-slate-950/20 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm mb-6 md:mb-8 px-4 md:px-8 pt-3 pb-4 md:pt-4 md:pb-6 rounded-xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Comprehensive Health Records
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {headerSlot !== null && (headerSlot ?? defaultHeader)}

      {/* Containerized Main Content */}
      <div className="max-w-6xl mx-auto pb-32">
        {/* Profile Card - Redesigned without banner */}
        <div className="glassmorphic-card mb-6 md:mb-8">
          <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
              {/* Profile Picture Section */}
              <div className="flex-shrink-0 self-center md:self-start">
                {patient.picture ? (
                  <img 
                    src={patient.picture} 
                    alt={patient.fullName}
                    className="w-20 h-20 md:w-32 md:h-32 rounded-xl object-cover shadow-lg border-2 border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-2xl md:text-4xl font-bold shadow-lg border-2 border-slate-200 dark:border-slate-700">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </div>
                )}
              </div>

              {/* Patient Info Section */}
              <div className="flex-grow w-full">
                <div className="mb-2">
                  <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}
                  </h2>
                  {patient.nickname && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">"{patient.nickname}"</p>
                  )}
                  {patient.caseNumber && (
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">Patient ID: {patient.caseNumber}</p>
                  )}
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-6">
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Age</p>
                    <p className="text-base md:text-xl font-semibold text-slate-900 dark:text-white">{patient.age} <span className="text-xs md:text-sm font-normal">yrs</span></p>
                  </div>
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Blood Type</p>
                    <p className="text-lg md:text-2xl font-bold text-red-500">{formatBloodType(patient.bloodType) || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Clinic</p>
                    <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-snug">{patient.clinic?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
        {PROFILE_TABS.map(tab => {
          const badge = tabBadges[tab.id]
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'dark:bg-white/10 dark:text-slate-300 bg-slate-100 text-slate-700 hover:dark:bg-white/20 hover:bg-slate-200'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {badge && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200'
                }`}>
                  {badge.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Demographics */}
          <div className="glassmorphic-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📋 Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patient.email && <div><p className="text-xs text-slate-600 dark:text-slate-400">Email</p><p className="text-slate-900 dark:text-white">{patient.email}</p></div>}
              {patient.mobile && <div><p className="text-xs text-slate-600 dark:text-slate-400">Mobile</p><p className="text-slate-900 dark:text-white">{patient.mobile}</p></div>}
              {patient.telephone && <div><p className="text-xs text-slate-600 dark:text-slate-400">Telephone</p><p className="text-slate-900 dark:text-white">{patient.telephone}</p></div>}
              {patient.dob && <div><p className="text-xs text-slate-600 dark:text-slate-400">DOB</p><p className="text-slate-900 dark:text-white">{new Date(patient.dob).toLocaleDateString()}</p></div>}
              {patient.gender && <div><p className="text-xs text-slate-600 dark:text-slate-400">Gender</p><p className="text-slate-900 dark:text-white capitalize">{patient.gender}</p></div>}
              {patient.suffix && <div><p className="text-xs text-slate-600 dark:text-slate-400">Suffix</p><p className="text-slate-900 dark:text-white">{patient.suffix}</p></div>}
              {patient.nickname && <div><p className="text-xs text-slate-600 dark:text-slate-400">Nickname</p><p className="text-slate-900 dark:text-white">{patient.nickname}</p></div>}
              {patient.nationality && <div><p className="text-xs text-slate-600 dark:text-slate-400">Nationality</p><p className="text-slate-900 dark:text-white">{patient.nationality}</p></div>}
              {patient.religion && <div><p className="text-xs text-slate-600 dark:text-slate-400">Religion</p><p className="text-slate-900 dark:text-white">{patient.religion}</p></div>}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glassmorphic-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{patient.medicalHistories.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Medical Conditions</p>
            </div>
            <div className="glassmorphic-card p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{patient.vitalSigns.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Vital Records</p>
            </div>
            <div className="glassmorphic-card p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{patient.medicalCertificates.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Certificates</p>
            </div>
            <div className="glassmorphic-card p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{patient.referralSlips.length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Referrals</p>
            </div>
          </div>

          {/* Latest Vitals */}
          {patient.latestVitals && (
            <div className="glassmorphic-card p-6 border border-red-200/30 dark:border-red-500/20">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Vital Signs</h3>
              </div>
              
              {patient.latestVitals ? (
                (() => {
                // Calculate BMI from height and weight if not stored
                const calculateBMI = (weight: number | null, height: number | null) => {
                  if (!weight || !height) return null
                  const heightInMeters = height / 100
                  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
                }

                // Calculate Body Fat Percentage (gender-specific)
                const calculateBodyFat = (weight: number | null, height: number | null, gender: string | null) => {
                  if (!weight || !height) return null
                  const bmi = parseFloat(calculateBMI(weight, height) || '0')
                  if (bmi === 0) return null
                  
                  if (gender?.toUpperCase() === 'MALE') {
                    return ((bmi * 1.07) - 7).toFixed(1)
                  } else {
                    return ((bmi * 1.07) - 2).toFixed(1)
                  }
                }

                // Generate clinical remarks based on vital values
                const generateClinicalRemarks = () => {
                  if (!patient.latestVitals) return []
                  const remarks: { icon: string; text: string }[] = []

                  // BP remarks
                  if (patient.latestVitals.bpSystolic && patient.latestVitals.bpDiastolic) {
                    const sys = patient.latestVitals.bpSystolic
                    const dia = patient.latestVitals.bpDiastolic
                    if (sys >= 180 || dia >= 120) {
                      remarks.push({ icon: '⚠️', text: 'Blood pressure is critically high - immediate medical attention recommended' })
                    } else if (sys >= 140 || dia >= 90) {
                      remarks.push({ icon: '⚠️', text: 'Blood pressure is elevated - monitor closely' })
                    } else if (sys < 90 || dia < 60) {
                      remarks.push({ icon: '⚠️', text: 'Blood pressure is low - may cause dizziness' })
                    }
                  }

                  // Heart rate remarks
                  if (patient.latestVitals.pulseRate) {
                    if (patient.latestVitals.pulseRate > 100) {
                      remarks.push({ icon: '❤️', text: 'Heart rate is elevated - may need attention' })
                    } else if (patient.latestVitals.pulseRate < 60) {
                      remarks.push({ icon: '💓', text: 'Heart rate is lower than normal - may indicate athletic fitness' })
                    }
                  }

                  // Temperature remarks
                  if (patient.latestVitals.temp) {
                    if (patient.latestVitals.temp > 38) {
                      remarks.push({ icon: '🌡️', text: 'Temperature is elevated - possible fever, seek medical advice' })
                    } else if (patient.latestVitals.temp < 36) {
                      remarks.push({ icon: '🌡️', text: 'Temperature is below normal - monitor for hypothermia' })
                    }
                  }

                  // SpO2 remarks
                  if (patient.latestVitals.spo2) {
                    if (patient.latestVitals.spo2 < 95) {
                      remarks.push({ icon: '💨', text: 'Oxygen saturation is low - may need supplemental oxygen' })
                    }
                  }

                  // Respiratory rate remarks
                  if (patient.latestVitals.respRate) {
                    if (patient.latestVitals.respRate > 25) {
                      remarks.push({ icon: '🫁', text: 'Respiratory rate is elevated - may indicate respiratory distress' })
                    } else if (patient.latestVitals.respRate < 12) {
                      remarks.push({ icon: '🫁', text: 'Respiratory rate is low - monitor breathing pattern' })
                    }
                  }

                  // BMI remarks
                  const displayBMI = patient.latestVitals.bmi || calculateBMI(patient.latestVitals.weight, patient.latestVitals.height)
                  if (displayBMI) {
                    const bmiNum = parseFloat(String(displayBMI))
                    if (bmiNum < 18.5) {
                      remarks.push({ icon: '⚖️', text: 'BMI indicates underweight - consider nutritional consultation' })
                    } else if (bmiNum >= 30) {
                      remarks.push({ icon: '⚖️', text: 'BMI indicates obesity - lifestyle changes recommended' })
                    } else if (bmiNum >= 25) {
                      remarks.push({ icon: '⚖️', text: 'BMI indicates overweight - consider weight management' })
                    }
                  }

                  // Body Fat remarks
                  const displayBodyFat = calculateBodyFat(patient.latestVitals.weight, patient.latestVitals.height, patient.gender)
                  if (displayBodyFat) {
                    const bfNum = parseFloat(displayBodyFat)
                    const isMale = patient.gender?.toUpperCase() === 'MALE'
                    
                    if (isMale && bfNum > 25) {
                      remarks.push({ icon: '💪', text: 'Body fat is higher than healthy range for males - fitness program recommended' })
                    } else if (!isMale && bfNum > 32) {
                      remarks.push({ icon: '💪', text: 'Body fat is higher than healthy range for females - fitness program recommended' })
                    }
                  }

                  return remarks
                }

                // Get BMI category
                const getBMICategory = (bmi: number | null) => {
                  if (bmi === null) return 'N/A'
                  const bmiNum = parseFloat(bmi.toString())
                  if (bmiNum < 18.5) return 'Underweight'
                  if (bmiNum < 25) return 'Normal'
                  if (bmiNum < 30) return 'Overweight'
                  return 'Obese'
                }

                // Get Body Fat category
                const getBodyFatCategory = (bodyFat: number | null, gender: string | null) => {
                  if (bodyFat === null) return 'N/A'
                  const bf = parseFloat(bodyFat.toString())
                  const isMale = gender?.toUpperCase() === 'MALE'
                  
                  if (isMale) {
                    if (bf < 10) return 'Essential'
                    if (bf < 14) return 'Athlete'
                    if (bf < 18) return 'Fitness'
                    if (bf < 25) return 'Average'
                    return 'High'
                  } else {
                    if (bf < 13) return 'Essential'
                    if (bf < 20) return 'Athlete'
                    if (bf < 25) return 'Fitness'
                    if (bf < 32) return 'Average'
                    return 'High'
                  }
                }
                
                const displayBMI = patient.latestVitals.bmi || calculateBMI(patient.latestVitals.weight, patient.latestVitals.height)
                const displayBodyFat = calculateBodyFat(patient.latestVitals.weight, patient.latestVitals.height, patient.gender)
                const clinicalRemarks = generateClinicalRemarks()
              
                return (
                  <>
                    {/* Vital Signs Grid - 3 columns */}
                    <div className="grid grid-cols-3 gap-8 mb-6">
                      {/* Column 1 */}
                      <div className="space-y-6">
                        {/* Blood Pressure */}
                        {patient.latestVitals.bpSystolic && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BP</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{patient.latestVitals.bpSystolic}/{patient.latestVitals.bpDiastolic}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">mmHg</p>
                          </div>
                        )}

                        {/* Height */}
                        {patient.latestVitals.height && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HEIGHT</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{patient.latestVitals.height}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">cm</p>
                          </div>
                        )}
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-6">
                        {/* Heart Rate */}
                        {patient.latestVitals.pulseRate && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HR</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{patient.latestVitals.pulseRate}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">bpm</p>
                          </div>
                        )}

                        {/* BMI */}
                        {displayBMI && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BMI</p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{displayBMI}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{getBMICategory(parseFloat(String(displayBMI)))}</p>
                          </div>
                        )}
                      </div>

                      {/* Column 3 */}
                      <div className="space-y-6">
                        {/* Temperature */}
                        {patient.latestVitals.temp && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">TEMP</p>
                            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{patient.latestVitals.temp}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">°C</p>
                          </div>
                        )}

                        {/* Body Fat */}
                        {displayBodyFat && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BODY FAT</p>
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{displayBodyFat}%</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{getBodyFatCategory(parseFloat(displayBodyFat), patient.gender)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Vitals Row */}
                    <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-slate-300/30 dark:border-white/10">
                      {/* SpO2 */}
                      {patient.latestVitals.spo2 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">SpO₂</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{patient.latestVitals.spo2}%</p>
                        </div>
                      )}

                      {/* Respiratory Rate */}
                      {patient.latestVitals.respRate && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">RR</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{patient.latestVitals.respRate}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">br/min</p>
                        </div>
                      )}

                      {/* Weight */}
                      {patient.latestVitals.weight && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">WEIGHT</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{patient.latestVitals.weight}kg</p>
                        </div>
                      )}
                    </div>

                    {/* Clinical Remarks Section */}
                    {clinicalRemarks.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">REMARKS</p>
                        <div className="space-y-2">
                          {clinicalRemarks.map((remark, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                              <span className="text-lg flex-shrink-0">{remark.icon}</span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{remark.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {patient.latestVitals.notes && (
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-lg border border-slate-200/50 dark:border-white/10">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">NOTES</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{patient.latestVitals.notes}</p>
                      </div>
                    )}
                  </>
                )
              })()
              ) : (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                  <p>No vital signs recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MEDICAL TAB */}
      {activeTab === 'medical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medical History */}
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🏥 Medical History</h3>
              {patient.medicalHistories.length > 0 ? (
                <div className="space-y-2">
                  {patient.medicalHistories.map((h, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                      <p className="font-semibold text-slate-900 dark:text-white">{h.condition}</p>
                      {h.details && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">No medical history</p>
              )}
            </div>

            {/* Family History */}
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👨‍👩‍👧 Family History</h3>
              {patient.familyMedicalHistories.length > 0 ? (
                <div className="space-y-2">
                  {patient.familyMedicalHistories.map((h, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                      <p className="font-semibold text-slate-900 dark:text-white">{h.condition}</p>
                      {h.details && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">No family history</p>
              )}
            </div>
          </div>

          {/* Surgical History */}
          {patient.surgicalHistories.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Surgical History</h3>
              <div className="space-y-3">
                {patient.surgicalHistories.map((surgery) => (
                  <div key={surgery.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                    <p className="font-semibold text-slate-900 dark:text-white">{surgery.operationName}</p>
                    {surgery.operationDate && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        📅 {new Date(surgery.operationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    {surgery.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        📝 {surgery.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Surgical History</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No surgical procedures recorded</p>
            </div>
          )}
        </div>
      )}

      {/* VITALS TAB */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          {patient.vitalSigns.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">📊 Vital Signs History</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Latest measurements and trends</p>
                </div>
                {patient.vitalSigns.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVitalsViewMode('list')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        vitalsViewMode === 'list'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-sm font-medium">List</span>
                    </button>
                    <button
                      onClick={() => setVitalsViewMode('chart')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        vitalsViewMode === 'chart'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Chart</span>
                    </button>
                  </div>
                )}
              </div>
              
              {vitalsViewMode === 'list' ? (
                <div className="space-y-3">
                  {patient.vitalSigns.map((v, i) => {
                    const getStatusColor = (value: number | null, min: number, optimal: number, max: number) => {
                      if (value === null) return 'text-slate-500'
                      if (value < min || value > max) return 'text-red-600 dark:text-red-400'
                      if (value < optimal || value > optimal + 10) return 'text-amber-600 dark:text-amber-400'
                      return 'text-green-600 dark:text-green-400'
                    }

                    const calculateBMI = (weight: number | null, height: number | null) => {
                      if (!weight || !height) return null
                      const heightInMeters = height / 100
                      return (weight / (heightInMeters * heightInMeters)).toFixed(1)
                    }

                    const calculateBodyFat = (weight: number | null, height: number | null, gender: string | null) => {
                      if (!weight || !height) return null
                      const bmi = parseFloat(calculateBMI(weight, height) || '0')
                      if (bmi === 0) return null
                      
                      if (gender?.toUpperCase() === 'MALE') {
                        return ((bmi * 1.07) - 7).toFixed(1)
                      } else {
                        return ((bmi * 1.07) - 2).toFixed(1)
                      }
                    }

                    const getBodyFatCategory = (bodyFat: number | null, gender: string | null) => {
                      if (bodyFat === null) return { category: 'N/A', color: 'text-slate-500' }
                      
                      const bf = parseFloat(bodyFat.toString())
                      const isMale = gender?.toUpperCase() === 'MALE'
                      
                      if (isMale) {
                        if (bf < 10) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
                        if (bf < 20) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
                        if (bf < 25) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
                        return { category: 'High', color: 'text-red-600 dark:text-red-400' }
                      } else {
                        if (bf < 18) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
                        if (bf < 25) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
                        if (bf < 32) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
                        return { category: 'High', color: 'text-red-600 dark:text-red-400' }
                      }
                    }

                    const getBMICategory = (bmi: number | null) => {
                      if (bmi === null) return { category: 'N/A', color: 'text-slate-500' }
                      if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600 dark:text-blue-400' }
                      if (bmi < 25) return { category: 'Normal', color: 'text-green-600 dark:text-green-400' }
                      if (bmi < 30) return { category: 'Overweight', color: 'text-amber-600 dark:text-amber-400' }
                      return { category: 'Obese', color: 'text-red-600 dark:text-red-400' }
                    }

                    const generateRemarks = () => {
                      const remarks: string[] = []
                      const isMale = patient.gender?.toUpperCase() === 'MALE'
                      
                      if (v.bpSystolic && v.bpSystolic > 140) {
                        remarks.push('⚠️ Blood pressure is elevated - consider monitoring')
                      } else if (v.bpSystolic && v.bpSystolic > 130) {
                        remarks.push('📊 Blood pressure is slightly elevated')
                      }
                      
                      if (v.pulseRate) {
                        if (v.pulseRate < 60 || v.pulseRate > 100) {
                          remarks.push(`⚠️ Heart rate is ${v.pulseRate < 60 ? 'low' : 'high'} - may need attention`)
                        }
                      }
                      
                      if (v.temp && v.temp > 38) {
                        remarks.push('🌡️ Temperature is elevated - possible fever')
                      } else if (v.temp && v.temp < 36.5) {
                        remarks.push('❄️ Temperature is low')
                      }
                      
                      if (v.spo2 && v.spo2 < 95) {
                        remarks.push('⚠️ Oxygen saturation is low - consult healthcare provider')
                      }
                      
                      const bmi = calculateBMI(v.weight, v.height)
                      if (bmi) {
                        const bmiNum = parseFloat(bmi)
                        if (bmiNum >= 30) {
                          remarks.push('📈 BMI indicates obesity - lifestyle changes recommended')
                        } else if (bmiNum >= 25) {
                          remarks.push('📊 BMI indicates overweight - consider exercise and diet')
                        }
                      }
                      
                      const bodyFat = calculateBodyFat(v.weight, v.height, patient.gender)
                      if (bodyFat) {
                        const bf = parseFloat(bodyFat)
                        if (isMale) {
                          if (bf >= 25) remarks.push('💪 Body fat is higher than healthy range for males')
                          else if (bf < 10) remarks.push('💪 Body fat is in athlete/very fit range')
                        } else {
                          if (bf >= 32) remarks.push('💪 Body fat is higher than healthy range for females')
                          else if (bf < 18) remarks.push('💪 Body fat is in athlete/very fit range')
                        }
                      }
                      
                      return remarks.length > 0 ? remarks : ['✅ Vital signs appear normal']
                    }

                    const bmi = calculateBMI(v.weight, v.height)
                    const bodyFat = calculateBodyFat(v.weight, v.height, patient.gender)
                    const bmiInfo = getBMICategory(bmi ? parseFloat(bmi) : null)
                    const bodyFatInfo = getBodyFatCategory(bodyFat ? parseFloat(bodyFat) : null, patient.gender)
                    const remarks = generateRemarks()

                    const dateTime = new Date(v.dateTaken)
                    const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

                    return (
                      <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        {/* Header: Date & Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                          </div>
                        </div>

                        {/* Measurements Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(v.bpSystolic || v.bpDiastolic) && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BP</p>
                              <p className={`text-sm font-bold ${getStatusColor(v.bpSystolic, 90, 120, 140)}`}>
                                {v.bpSystolic}/{v.bpDiastolic}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">mmHg</p>
                            </div>
                          )}

                          {v.pulseRate && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HR</p>
                              <p className={`text-sm font-bold ${getStatusColor(v.pulseRate, 50, 72, 100)}`}>
                                {v.pulseRate}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">bpm</p>
                            </div>
                          )}

                          {v.temp && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Temp</p>
                              <p className={`text-sm font-bold ${getStatusColor(v.temp, 36, 37, 38.5)}`}>
                                {v.temp}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">°C</p>
                            </div>
                          )}

                          {v.spo2 && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">SpO₂</p>
                              <p className={`text-sm font-bold ${getStatusColor(v.spo2, 94, 98, 100)}`}>
                                {v.spo2}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">%</p>
                            </div>
                          )}

                          {v.respRate && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">RR</p>
                              <p className={`text-sm font-bold ${getStatusColor(v.respRate, 12, 16, 20)}`}>
                                {v.respRate}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">br/min</p>
                            </div>
                          )}

                          {v.weight && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Weight</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {v.weight}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">kg</p>
                            </div>
                          )}

                          {v.height && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Height</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {v.height}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">cm</p>
                            </div>
                          )}

                          {bmi && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BMI</p>
                              <p className={`text-sm font-bold ${bmiInfo.color}`}>
                                {bmi}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{bmiInfo.category}</p>
                            </div>
                          )}

                          {bodyFat && (
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Body Fat</p>
                              <p className={`text-sm font-bold ${bodyFatInfo.color}`}>
                                {bodyFat}%
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{bodyFatInfo.category}</p>
                            </div>
                          )}
                        </div>

                        {/* Remarks */}
                        {remarks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Remarks</p>
                            <ul className="space-y-1">
                              {remarks.map((remark, idx) => (
                                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                                  {remark}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Notes */}
                        {v.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{v.notes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={patient.vitalSigns
                        .slice()
                        .reverse()
                        .map((v, i) => ({
                          date: new Date(v.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          timestamp: new Date(v.dateTaken).getTime(),
                          bpSystolic: v.bpSystolic,
                          bpDiastolic: v.bpDiastolic,
                          pulseRate: v.pulseRate,
                          temp: v.temp,
                          spo2: v.spo2,
                          respRate: v.respRate,
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp)
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                      <XAxis 
                        dataKey="date"
                        stroke="rgb(100, 116, 139)"
                        strokeOpacity={0.5}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="rgb(100, 116, 139)"
                        strokeOpacity={0.5}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(15, 23, 42)',
                          border: '1px solid rgb(71, 85, 105)',
                          borderRadius: '8px',
                          color: 'rgb(226, 232, 240)',
                        }}
                        labelStyle={{ color: 'rgb(226, 232, 240)' }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      {patient.vitalSigns.some(v => v.bpSystolic) && (
                        <Line
                          type="monotone"
                          dataKey="bpSystolic"
                          stroke="#ef4444"
                          dot={false}
                          name="BP Systolic (mmHg)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.vitalSigns.some(v => v.bpDiastolic) && (
                        <Line
                          type="monotone"
                          dataKey="bpDiastolic"
                          stroke="#f97316"
                          dot={false}
                          name="BP Diastolic (mmHg)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.vitalSigns.some(v => v.pulseRate) && (
                        <Line
                          type="monotone"
                          dataKey="pulseRate"
                          stroke="#06b6d4"
                          dot={false}
                          name="Heart Rate (bpm)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.vitalSigns.some(v => v.temp) && (
                        <Line
                          type="monotone"
                          dataKey="temp"
                          stroke="#ec4899"
                          dot={false}
                          name="Temperature (°C)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.vitalSigns.some(v => v.spo2) && (
                        <Line
                          type="monotone"
                          dataKey="spo2"
                          stroke="#8b5cf6"
                          dot={false}
                          name="SpO₂ (%)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.vitalSigns.some(v => v.respRate) && (
                        <Line
                          type="monotone"
                          dataKey="respRate"
                          stroke="#14b8a6"
                          dot={false}
                          name="Respiration Rate (br/min)"
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">❤️ Vital Signs</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vital signs recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {patient.physicalExaminations.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">🔍 Physical Examinations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Latest physical examination records</p>
              <div className="space-y-3">
                {patient.physicalExaminations.map((e, i) => {
                  const getStatusColor = (status: string | null) => {
                    if (!status) return { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' }
                    const statusLower = status.toLowerCase()
                    if (statusLower === 'good' || statusLower === 'normal') 
                      return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
                    if (statusLower === 'fair' || statusLower === 'moderate') 
                      return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                    if (statusLower === 'poor' || statusLower === 'abnormal') 
                      return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
                    return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                  }

                  const getVisionStatus = (acuity: string | null) => {
                    if (!acuity) return 'Not recorded'
                    const acuityNum = parseFloat(acuity)
                    if (isNaN(acuityNum)) return acuity
                    if (acuityNum >= 1.0) return `${acuity} - Normal`
                    if (acuityNum >= 0.8) return `${acuity} - Good`
                    if (acuityNum >= 0.5) return `${acuity} - Fair`
                    return `${acuity} - Poor`
                  }

                  const statusInfo = getStatusColor(e.status)
                  const dateTime = new Date(e.createdAt)
                  const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

                  return (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {/* Header: Date, Time & Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                        </div>
                        {e.status && (
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color} ${statusInfo.bg}`}>
                            {e.status}
                          </div>
                        )}
                      </div>

                      {/* Examination Findings */}
                      <div className="space-y-3">
                        {/* Visual Acuity */}
                        {(e.visualAcuityLeft || e.visualAcuityRight) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                            {e.visualAcuityLeft && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Visual Acuity (Left)</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{getVisionStatus(e.visualAcuityLeft)}</p>
                              </div>
                            )}
                            {e.visualAcuityRight && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Visual Acuity (Right)</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{getVisionStatus(e.visualAcuityRight)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Examination Summary */}
                        {e.status && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{
                              backgroundColor: e.status.toLowerCase() === 'good' || e.status.toLowerCase() === 'normal' ? '#16a34a' :
                                             e.status.toLowerCase() === 'fair' || e.status.toLowerCase() === 'moderate' ? '#d97706' :
                                             e.status.toLowerCase() === 'poor' || e.status.toLowerCase() === 'abnormal' ? '#dc2626' : '#3b82f6'
                            }}></div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {e.status.toLowerCase() === 'good' && '✅ Physical examination is within normal limits'}
                              {e.status.toLowerCase() === 'normal' && '✅ All findings are normal'}
                              {e.status.toLowerCase() === 'fair' && '📊 Some findings observed - follow-up recommended'}
                              {e.status.toLowerCase() === 'moderate' && '⚠️ Moderate findings - medical attention advised'}
                              {e.status.toLowerCase() === 'poor' && '⚠️ Significant findings - consult healthcare provider'}
                              {e.status.toLowerCase() === 'abnormal' && '⚠️ Abnormal findings - requires evaluation'}
                              {!['good', 'normal', 'fair', 'moderate', 'poor', 'abnormal'].includes(e.status.toLowerCase()) && `Examination status: ${e.status}`}
                            </p>
                          </div>
                        )}

                        {!e.status && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">No additional details recorded for this examination</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🔍 Physical Examinations</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No physical examinations recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* OB/GYN TAB */}
      {activeTab === 'obgyn' && (
        <div className="space-y-6">
          {patient.gender?.toUpperCase() === 'MALE' ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 OB/GYN History</h3>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-5xl mb-3">♂️</div>
                  <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">OB/GYN records are not applicable</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm">Obstetric and gynecological history is specific to female patients.</p>
                </div>
              </div>
            </div>
          ) : patient.obGyneHistory ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 OB/GYN History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {patient.obGyneHistory.menarche &&<div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Menarche</p><p className="font-semibold">{patient.obGyneHistory.menarche} yrs</p></div>}
                {patient.obGyneHistory.gravidity && <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Gravidity</p><p className="font-semibold">{patient.obGyneHistory.gravidity}</p></div>}
                {patient.obGyneHistory.parity && <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Parity</p><p className="font-semibold">{patient.obGyneHistory.parity}</p></div>}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No OB/GYN history recorded</p>
            </div>
          )}
        </div>
      )}

      {/* PEDIATRIC TAB */}
      {activeTab === 'pediatric' && (
        <div className="space-y-6">
          {patient.pediatricMeasurements.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">👶 Pediatric Measurements</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPediatricViewMode('list')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      pediatricViewMode === 'list'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                  <button
                    onClick={() => setPediatricViewMode('chart')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      pediatricViewMode === 'chart'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Chart
                  </button>
                </div>
              </div>

              {pediatricViewMode === 'list' ? (
                <div className="space-y-4">
                  {patient.pediatricMeasurements.map((p, i) => {
                    const ageMonths = calculateAgeInMonths(new Date(patient.dob!), new Date(p.dateTaken))
                    const lengthPercentile = p.length ? getLengthPercentile(ageMonths, Number(p.length), patient.gender as 'MALE' | 'FEMALE') : null
                    const weightPercentile = p.length ? getWeightPercentile(ageMonths, Number(p.length), patient.gender as 'MALE' | 'FEMALE') : null

                    return (
                      <div key={i} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        {/* Header with Date and Age */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {new Date(p.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Age: {formatAge(new Date(patient.dob!), new Date(p.dateTaken))} ({ageMonths} months)
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(p.dateTaken).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                        </div>

                        {/* Measurements Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {/* Length */}
                          {p.length && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Length</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{p.length.toString()} cm</p>
                              {lengthPercentile && (
                                <p className={`text-xs font-semibold ${getGrowthStatusColor(lengthPercentile.status)}`}>
                                  {lengthPercentile.percentile}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Head Circumference */}
                          {p.headCircumference && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HC</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{p.headCircumference.toString()} cm</p>
                              <p className="text-xs text-slate-500">Head Circum.</p>
                            </div>
                          )}

                          {/* Waist Circumference */}
                          {p.waistCircumference && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Waist</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{p.waistCircumference.toString()} cm</p>
                            </div>
                          )}

                          {/* Hip Circumference */}
                          {p.hipCircumference && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Hip</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{p.hipCircumference.toString()} cm</p>
                            </div>
                          )}

                          {/* MUAC */}
                          {p.midUpperArmCircumference && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">MUAC</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{p.midUpperArmCircumference.toString()} cm</p>
                            </div>
                          )}

                          {/* Limb Circumference */}
                          {p.limbCircumference && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Limb</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{p.limbCircumference.toString()} cm</p>
                            </div>
                          )}

                          {/* Skinfold Thickness */}
                          {p.skinfoldThickness && (
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Skinfold</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{p.skinfoldThickness.toString()} mm</p>
                            </div>
                          )}
                        </div>

                        {/* Remarks */}
                        {p.remarks && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Remarks</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{p.remarks}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                // Chart View
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={patient.pediatricMeasurements
                        .map((p, i) => {
                          const ageMonths = calculateAgeInMonths(new Date(patient.dob!), new Date(p.dateTaken))
                          return {
                            date: new Date(p.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            timestamp: new Date(p.dateTaken).getTime(),
                            ageMonths: ageMonths,
                            length: p.length ? Number(p.length) : null,
                            headCircumference: p.headCircumference ? Number(p.headCircumference) : null,
                            waistCircumference: p.waistCircumference ? Number(p.waistCircumference) : null,
                            hipCircumference: p.hipCircumference ? Number(p.hipCircumference) : null,
                            midUpperArmCircumference: p.midUpperArmCircumference ? Number(p.midUpperArmCircumference) : null,
                            limbCircumference: p.limbCircumference ? Number(p.limbCircumference) : null,
                            skinfoldThickness: p.skinfoldThickness ? Number(p.skinfoldThickness) : null,
                          }
                        })
                        .sort((a, b) => a.timestamp - b.timestamp)
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                      <XAxis 
                        dataKey="date"
                        stroke="rgb(100, 116, 139)"
                        strokeOpacity={0.5}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="rgb(100, 116, 139)"
                        strokeOpacity={0.5}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(15, 23, 42)',
                          border: '1px solid rgb(71, 85, 105)',
                          borderRadius: '8px',
                          color: 'rgb(226, 232, 240)',
                        }}
                        labelStyle={{ color: 'rgb(226, 232, 240)' }}
                        formatter={(value, name) => {
                          if (value === null) return 'N/A'
                          const labels: Record<string, string> = {
                            length: 'Length (cm)',
                            headCircumference: 'HC (cm)',
                            waistCircumference: 'Waist (cm)',
                            hipCircumference: 'Hip (cm)',
                            midUpperArmCircumference: 'MUAC (cm)',
                            limbCircumference: 'Limb (cm)',
                            skinfoldThickness: 'Skinfold (mm)',
                          }
                          return [value, labels[name] || name]
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      {patient.pediatricMeasurements.some(p => p.length) && (
                        <Line
                          type="monotone"
                          dataKey="length"
                          stroke="#06b6d4"
                          dot={false}
                          name="Length (cm)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.pediatricMeasurements.some(p => p.headCircumference) && (
                        <Line
                          type="monotone"
                          dataKey="headCircumference"
                          stroke="#f97316"
                          dot={false}
                          name="HC (cm)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.pediatricMeasurements.some(p => p.waistCircumference) && (
                        <Line
                          type="monotone"
                          dataKey="waistCircumference"
                          stroke="#ec4899"
                          dot={false}
                          name="Waist (cm)"
                          strokeWidth={2}
                        />
                      )}
                      {patient.pediatricMeasurements.some(p => p.midUpperArmCircumference) && (
                        <Line
                          type="monotone"
                          dataKey="midUpperArmCircumference"
                          stroke="#8b5cf6"
                          dot={false}
                          name="MUAC (cm)"
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 Pediatric Measurements</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No pediatric measurements recorded</p>
            </div>
          )}
        </div>
      )}

   
      {/* ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          {patient.userAddresses.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📍 Addresses</h3>
              <div className="space-y-3">
                {patient.userAddresses.map((addr) => (
                  <div key={addr.id} className="p-4 rounded-lg bg-green-50/30 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Primary</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{addr.isPrimary ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Address</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{addr.address}</p>
                      </div>
                      {addr.apartmentUnit && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Unit</p>
                          <p className="text-slate-700 dark:text-slate-300">{addr.apartmentUnit}</p>
                        </div>
                      )}
                      {addr.bldgName && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Building</p>
                          <p className="text-slate-700 dark:text-slate-300">{addr.bldgName}</p>
                        </div>
                      )}
                      {addr.street && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Street</p>
                          <p className="text-slate-700 dark:text-slate-300">{addr.street}</p>
                        </div>
                      )}
                      {addr.barangay && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Barangay</p>
                          <p className="text-slate-700 dark:text-slate-300">{addr.barangay}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">City</p>
                        <p className="text-slate-700 dark:text-slate-300">{addr.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">State/Province</p>
                        <p className="text-slate-700 dark:text-slate-300">{addr.state}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Country</p>
                        <p className="text-slate-700 dark:text-slate-300">{addr.country}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Zip Code</p>
                        <p className="text-slate-700 dark:text-slate-300">{addr.zipCode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📍 Addresses</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No addresses recorded</p>
            </div>
          )}
        </div>
      )}

      {/* CONTACTS TAB */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          {patient.userEmergencyContacts.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🆘 Emergency Contacts</h3>
              <div className="space-y-3">
                {patient.userEmergencyContacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Name</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{contact.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Relationship</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{contact.relationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Phone</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{contact.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Primary</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{contact.isPrimary ? 'Yes' : 'No'}</p>
                      </div>
                      {contact.address && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Address</p>
                          <p className="text-slate-700 dark:text-slate-300">{contact.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🆘 Emergency Contacts</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No emergency contacts recorded</p>
            </div>
          )}
        </div>
      )}

      {/* LIFESTYLE TAB */}
      {activeTab === 'lifestyle' && (
        <div className="space-y-6">
          {/* Personal History */}
          {patient.personalHistory ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👤 Lifestyle & Personal History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.personalHistory.smokingStatus && <div><p className="text-xs text-slate-600 dark:text-slate-400">Smoking</p><p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.smokingStatus}</p></div>}
                {patient.personalHistory.alcoholStatus && <div><p className="text-xs text-slate-600 dark:text-slate-400">Alcohol</p><p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.alcoholStatus}</p></div>}
                {patient.personalHistory.illicitDrugUse && <div><p className="text-xs text-slate-600 dark:text-slate-400">Drug Use</p><p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.illicitDrugUse}</p></div>}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👤 Lifestyle & Personal History</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No personal history recorded</p>
            </div>
          )}

        </div>
      )}

      {/* ALLERGIES TAB */}
      {activeTab === 'allergies' && (
        <div className="space-y-6">
          {patient.userAllergies.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚠️ Allergies</h3>
              <div className="space-y-3">
                {patient.userAllergies.map((allergy) => (
                  <div key={allergy.id} className="p-4 rounded-lg bg-red-50/30 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Allergen</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{allergy.allergen}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Reaction</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{allergy.reaction}</p>
                      </div>
                      {allergy.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                          <p className="text-slate-700 dark:text-slate-300">{allergy.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚠️ Allergies</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No allergies recorded</p>
            </div>
          )}
        </div>
      )}

      {/* VACCINATIONS TAB */}
      {activeTab === 'vaccinations' && (
        <div className="space-y-6">
          {patient.userVaccinations.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">💉 Vaccinations & Immunizations</h3>
              <div className="space-y-3">
                {patient.userVaccinations.map((vaccination) => (
                  <div key={vaccination.id} className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Vaccine</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{vaccination.vaccine}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Dose</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{vaccination.dose}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Route</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{vaccination.route}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Date Given</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{new Date(vaccination.dateGiven).toLocaleDateString()}</p>
                      </div>
                      {vaccination.administeredBy && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Administered By</p>
                          <p className="text-slate-900 dark:text-white font-semibold">{vaccination.administeredBy}</p>
                        </div>
                      )}
                      {vaccination.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                          <p className="text-slate-700 dark:text-slate-300">{vaccination.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">💉 Vaccinations & Immunizations</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vaccinations recorded</p>
            </div>
          )}
        </div>
      )}

      {/* DISABILITIES TAB */}
      {activeTab === 'disabilities' && (
        <div className="space-y-6">
          {patient.userDisabilities.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">♿ Disabilities & Illnesses</h3>
              <div className="space-y-3">
                {patient.userDisabilities.map((disability) => (
                  <div key={disability.id} className="p-4 rounded-lg bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/30 dark:border-purple-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Disability/Illness</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{disability.disability}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Severity</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{disability.severity}</p>
                      </div>
                      {disability.dateDiagnosed && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Date Diagnosed</p>
                          <p className="text-slate-900 dark:text-white font-semibold">{new Date(disability.dateDiagnosed).toLocaleDateString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Managed</p>
                        <p className="text-slate-900 dark:text-white font-semibold">{disability.isManaged ? 'Yes' : 'No'}</p>
                      </div>
                      {disability.diagnosedBy && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Diagnosed By</p>
                          <p className="text-slate-900 dark:text-white font-semibold">{disability.diagnosedBy}</p>
                        </div>
                      )}
                      {disability.reason && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Reason</p>
                          <p className="text-slate-700 dark:text-slate-300">{disability.reason}</p>
                        </div>
                      )}
                      {disability.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                          <p className="text-slate-700 dark:text-slate-300">{disability.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">♿ Disabilities & Illnesses</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No disabilities recorded</p>
            </div>
          )}
        </div>
      )}

      {/* INSURANCE & DOCS TAB */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <PhilHealthRecords records={(patient.philHealthRecords?.filter(r => r.PhilHealthMemberType) || []) as any} />
          
             {/* Medical Certificates */}
          {patient.medicalCertificates.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📜 Medical Certificates</h3>
              <div className="space-y-2">
                {patient.medicalCertificates.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{c.serialNumber}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Created: {new Date(c.createdAt).toLocaleDateString()} | By: {c.createdBy}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📜 Medical Certificates</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No medical certificates found</p>
            </div>
          )}

          {/* Referral Slips */}
          {patient.referralSlips.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📋 Referral Slips</h3>
              <div className="space-y-2">
                {patient.referralSlips.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">Referred to: {r.referredTo || 'N/A'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Reason: {r.reason || 'N/A'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Date: {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📋 Referral Slips</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No referral slips found</p>
            </div>
          )}

          {/* Procedure History */}
          {patient.procedureHistory.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Procedure History</h3>
              <div className="space-y-2">
                {patient.procedureHistory.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(p.usedAt).toLocaleDateString()}</p>
                    {p.procedureName && <p className="text-xs text-slate-600 dark:text-slate-400">{p.procedureName}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Procedure History</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No procedures recorded</p>
            </div>
          )}
         
        </div>
      )}

      {/* Edit Profile Button - Floating */}
      {editProfileHref !== null && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 md:gap-3">
          {appointmentsHref && (
          <button
            onClick={() => router.push(appointmentsHref)}
            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-green-600 to-teal-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden lg:inline">Appts &amp; Consultations</span>
          </button>
          )}
          {filesHref !== null && (
          <button
            onClick={() => router.push(filesHref ?? '/v2/patient/files')}
            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden lg:inline">{filesButtonLabel}</span>
          </button>
          )}
          <DownloadPHRButton
            printHref={downloadPHRHref}
            patientName={patient.fullName}
          />
          {aiInsightConfig && (
            <PatientAIInsightButton
              patientId={aiInsightConfig.patientId}
              clinicId={aiInsightConfig.clinicId}
              patientName={patient.fullName}
              size="default"
              className="shadow-lg"
            />
          )}
          <button
            onClick={() => router.push(editProfileHref ?? '/v2/profile/edit')}
            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden lg:inline">Edit Profile</span>
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
