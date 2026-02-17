'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Heart, 
  AlertCircle, 
  FileText, 
  Users,
  Mail,
  Edit2,
  ChevronDown,
  Calendar,
  Activity,
  Baby,
  Cigarette,
  Award,
  Clock,
  CheckCircle,
  BarChart3,
  List,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { calculateAgeInMonths, formatAge, getLengthPercentile, getWeightPercentile, getGrowthStatusColor, getGrowthStatusBgColor } from '@/lib/pediatric-growth-utils'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { PhilHealthRecords } from '@/components/patient-dashboard-v2/PhilHealthRecords'
import { formatBloodType } from '@/lib/utils'
import type { 
  VitalSign, 
  PhysicalExamination, 
  ObGyneHistory, 
  PediatricMeasurement, 
  PersonalHistory, 
  PhilHealthRecord, 
  ProcedureUsageHistory
} from '@prisma/client'

interface ClinicInfo {
  id: number
  name: string
}

interface MedicalHistoryData {
  id: number
  condition: string
  details: string | null
}

interface CertificateData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  createdAt: Date
  clinic: string | undefined
  createdBy: string
}

interface ReferralData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  referredTo: string | null
  reason: string | null
  createdAt: Date
  clinic: string | undefined
  createdBy: string
}

interface PatientHealthRecords {
  // Demographics
  id: number
  userId: string
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string
  picture: string | null
  email: string
  mobile: string | null
  telephone: string | null
  dob: Date | null
  age: number | null
  gender: string | null
  bloodType: string | null
  civilStatus: string | null
  placeOfBirth: string | null
  nationality: string | null
  religion: string | null
  suffix: string | null
  nickname: string | null
  caseNumber: string | null
  createdAt: Date
  updatedAt: Date
  clinic: ClinicInfo | null
  
  // Medical Profile
  medicalHistories: MedicalHistoryData[]
  familyMedicalHistories: MedicalHistoryData[]
  
  // Vital Signs
  vitalSigns: VitalSign[]
  latestVitals: VitalSign | null
  
  // Physical Examinations
  physicalExaminations: PhysicalExamination[]
  
  // OB/Gyn History
  obGyneHistory: ObGyneHistory | null
  
  // Pediatric Measurements
  pediatricMeasurements: PediatricMeasurement[]
  
  // Personal History
  personalHistory: PersonalHistory | null
  
  // Insurance & Documents
  philHealthRecords: (PhilHealthRecord & {
    PhilHealthMemberType?: { id: number; type: string }
    PhilHealthDependents?: { id: number; firstName: string; middleName?: string; lastName?: string; suffix?: string; relationship?: string }[]
  })[]
  procedureHistory: ProcedureUsageHistory[]
  medicalCertificates: CertificateData[]
  referralSlips: ReferralData[]
}
  
export default function PatientProfilePage() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientHealthRecords | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [vitalsViewMode, setVitalsViewMode] = useState<'list' | 'chart'>('list')
  const [pediatricViewMode, setPediatricViewMode] = useState<'list' | 'chart'>('list')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPatientHealthRecords()
      setPatient(data as PatientHealthRecords | null)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Badge status helpers
  const getTabBadge = (tabId: string): { status: string; count: number } | null => {
    if (!patient) return null
    
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
        if (!patient.obGyneHistory && patient.gender?.toLowerCase() === 'female') incompleteCount++
        if (patient.pediatricMeasurements.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      case 'insurance': {
        let incompleteCount = 0
        if (patient.philHealthRecords.length === 0) incompleteCount++
        if (patient.medicalCertificates.length === 0) incompleteCount++
        if (patient.referralSlips.length === 0) incompleteCount++
        if (patient.procedureHistory.length === 0) incompleteCount++
        return incompleteCount > 0 ? { status: 'Incomplete', count: incompleteCount } : null
      }
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="h-64 bg-slate-300/40 dark:bg-slate-700/50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 text-center">
            <p className="text-red-300 font-semibold">Unable to load health records</p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'medical', label: 'Medical Profile', icon: '🏥' },
    { id: 'vitals', label: 'Vital Signs', icon: '❤️' },
    { id: 'exams', label: 'Physical Exams', icon: '🔍' },
    { id: 'obgyn', label: 'OB/GYN', icon: '👶' },
    { id: 'pediatric', label: 'Pediatric', icon: '📏' },
    { id: 'lifestyle', label: 'Lifestyle & Social', icon: '👤' },
    { id: 'insurance', label: 'Insurance & Docs', icon: '📄' },
  ]

  return (
    <div className="w-full">
      {/* Full-Width Header Background */}
      <div className=" sticky top-0 z-50 bg-gradient-to-b from-slate-50/20 via-blue-50/20 to-transparent dark:from-slate-950/20 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm mb-8 px-8 pt-4 pb-6 rounded-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Comprehensive Health Records
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Containerized Main Content */}
      <div className="max-w-6xl mx-auto pb-32">
        {/* Profile Card */}
        <div className="glassmorphic-card overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-32 flex items-end px-8 pb-4">
          {patient.picture ? (
            <img 
              src={patient.picture} 
              alt={patient.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>
          )}
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {patient.fullName}
              </h2>
              {patient.caseNumber && (
                <p className="text-sm text-slate-600 dark:text-slate-400">ID: {patient.caseNumber}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-400">Age</p>
              <p className="font-semibold text-slate-900 dark:text-white">{patient.age} years</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-400">Blood Type</p>
              <p className="font-semibold text-lg text-red-500">{formatBloodType(patient.bloodType) || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-400">Primary Clinic</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{patient.clinic?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const badge = getTabBadge(tab.id)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'dark:bg-white/10 dark:text-slate-300 bg-slate-100 text-slate-700 hover:dark:bg-white/20 hover:bg-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {badge && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200'
                }`}>
                  {badge.status} ({badge.count})
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
              {patient.dob && <div><p className="text-xs text-slate-600 dark:text-slate-400">DOB</p><p className="text-slate-900 dark:text-white">{new Date(patient.dob).toLocaleDateString()}</p></div>}
              {patient.gender && <div><p className="text-xs text-slate-600 dark:text-slate-400">Gender</p><p className="text-slate-900 dark:text-white capitalize">{patient.gender}</p></div>}
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
                    const bmiNum = parseFloat(displayBMI)
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
                            <p className="text-xs text-slate-600 dark:text-slate-400">{getBMICategory(parseFloat(displayBMI))}</p>
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
        </div>
      )}

      {/* VITALS & EXAMS TAB */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          {/* Vital Signs History */}
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
            
            {patient.vitalSigns.length > 0 ? (
              <>
                {vitalsViewMode === 'list' ? (
                  <div className="space-y-3">
                {patient.vitalSigns.map((v, i) => {
                  // Helper function to determine status color
                  // Helper function to determine status color
                  const getStatusColor = (value: number | null, min: number, optimal: number, max: number) => {
                    if (value === null) return 'text-slate-500'
                    if (value < min || value > max) return 'text-red-600 dark:text-red-400'
                    if (value < optimal || value > optimal + 10) return 'text-amber-600 dark:text-amber-400'
                    return 'text-green-600 dark:text-green-400'
                  }

                  // Calculate BMI
                  const calculateBMI = (weight: number | null, height: number | null) => {
                    if (!weight || !height) return null
                    const heightInMeters = height / 100
                    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
                  }

                  // Calculate Body Fat Percentage (gender-specific using Katch-McArdle formula approximation)
                  const calculateBodyFat = (weight: number | null, height: number | null, gender: string | null) => {
                    if (!weight || !height) return null
                    const bmi = parseFloat(calculateBMI(weight, height) || '0')
                    if (bmi === 0) return null
                    
                    // Simplified body fat estimation based on BMI and gender
                    if (gender?.toUpperCase() === 'MALE') {
                      // Men formula: (1.20 × BMI) + (0.23 × Age) − 16.2
                      // Using simplified version without age: (BMI × 1.07) - 7
                      return ((bmi * 1.07) - 7).toFixed(1)
                    } else {
                      // Women formula: (1.20 × BMI) + (0.23 × Age) − 5.4
                      // Using simplified version without age: (BMI × 1.07)
                      return ((bmi * 1.07) - 2).toFixed(1)
                    }
                  }

                  // Get body fat category and color (gender-specific)
                  const getBodyFatCategory = (bodyFat: number | null, gender: string | null) => {
                    if (bodyFat === null) return { category: 'N/A', color: 'text-slate-500' }
                    
                    const bf = parseFloat(bodyFat.toString())
                    const isMale = gender?.toUpperCase() === 'MALE'
                    
                    if (isMale) {
                      // Male ranges
                      if (bf < 10) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
                      if (bf < 20) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
                      if (bf < 25) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
                      return { category: 'High', color: 'text-red-600 dark:text-red-400' }
                    } else {
                      // Female ranges
                      if (bf < 18) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
                      if (bf < 25) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
                      if (bf < 32) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
                      return { category: 'High', color: 'text-red-600 dark:text-red-400' }
                    }
                  }

                  // Get BMI category and color
                  const getBMICategory = (bmi: number | null) => {
                    if (bmi === null) return { category: 'N/A', color: 'text-slate-500' }
                    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600 dark:text-blue-400' }
                    if (bmi < 25) return { category: 'Normal', color: 'text-green-600 dark:text-green-400' }
                    if (bmi < 30) return { category: 'Overweight', color: 'text-amber-600 dark:text-amber-400' }
                    return { category: 'Obese', color: 'text-red-600 dark:text-red-400' }
                  }

                  // Generate gender-specific remarks based on vital signs
                  const generateRemarks = () => {
                    const remarks: string[] = []
                    const isMale = patient.gender?.toUpperCase() === 'MALE'
                    
                    if (v.bpSystolic && v.bpSystolic > 140) {
                      remarks.push('⚠️ Blood pressure is elevated - consider monitoring')
                    } else if (v.bpSystolic && v.bpSystolic > 130) {
                      remarks.push('📊 Blood pressure is slightly elevated')
                    }
                    
                    // Gender-specific heart rate remarks
                    if (v.pulseRate) {
                      const maleMin = 60, maleMax = 100, femaleMin = 60, femaleMax = 100
                      const hrMin = isMale ? maleMin : femaleMin
                      const hrMax = isMale ? maleMax : femaleMax
                      
                      if (v.pulseRate < hrMin || v.pulseRate > hrMax) {
                        remarks.push(`⚠️ Heart rate is ${v.pulseRate < hrMin ? 'low' : 'high'} - may need attention`)
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
                    
                    // Gender-specific body fat remarks
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
                        {/* Blood Pressure */}
                        {(v.bpSystolic || v.bpDiastolic) && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BP</p>
                            <p className={`text-sm font-bold ${getStatusColor(v.bpSystolic, 90, 120, 140)}`}>
                              {v.bpSystolic}/{v.bpDiastolic}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">mmHg</p>
                          </div>
                        )}

                        {/* Heart Rate */}
                        {v.pulseRate && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HR</p>
                            <p className={`text-sm font-bold ${getStatusColor(v.pulseRate, 50, 72, 100)}`}>
                              {v.pulseRate}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">bpm</p>
                          </div>
                        )}

                        {/* Temperature */}
                        {v.temp && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Temp</p>
                            <p className={`text-sm font-bold ${getStatusColor(v.temp, 36, 37, 38.5)}`}>
                              {v.temp}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">°C</p>
                          </div>
                        )}

                        {/* Oxygen Saturation */}
                        {v.spo2 && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">SpO₂</p>
                            <p className={`text-sm font-bold ${getStatusColor(v.spo2, 94, 98, 100)}`}>
                              {v.spo2}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">%</p>
                          </div>
                        )}

                        {/* Respiration Rate */}
                        {v.respRate && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">RR</p>
                            <p className={`text-sm font-bold ${getStatusColor(v.respRate, 12, 16, 20)}`}>
                              {v.respRate}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">br/min</p>
                          </div>
                        )}

                        {/* Weight */}
                        {v.weight && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Weight</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {v.weight}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">kg</p>
                          </div>
                        )}

                        {/* Height */}
                        {v.height && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Height</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {v.height}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">cm</p>
                          </div>
                        )}

                        {/* BMI */}
                        {bmi && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BMI</p>
                            <p className={`text-sm font-bold ${bmiInfo.color}`}>
                              {bmi}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{bmiInfo.category}</p>
                          </div>
                        )}

                        {/* Body Fat Percentage */}
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
                  // Chart View
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
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No vital signs recorded yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Start by recording your first vital signs</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {/* Physical Exams */}
          {patient.physicalExaminations.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">🔍 Physical Examinations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Latest physical examination records</p>
              <div className="space-y-3">
                {patient.physicalExaminations.map((e, i) => {
                  // Status color coding
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

                  // Visual acuity interpretation
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {patient.obGyneHistory.menarche && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Menarche</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.menarche} yrs</p>
                  </div>
                )}
                {patient.obGyneHistory.lastMenstrualPeriod && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Last Menstrual Period</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{new Date(patient.obGyneHistory.lastMenstrualPeriod).toLocaleDateString()}</p>
                  </div>
                )}
                {patient.obGyneHistory.gravidity && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Gravidity</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.gravidity}</p>
                  </div>
                )}
                {patient.obGyneHistory.parity && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Parity</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.parity}</p>
                  </div>
                )}
                {patient.obGyneHistory.menstrualCycleInterval && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Cycle Interval</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.menstrualCycleInterval} days</p>
                  </div>
                )}
                {patient.obGyneHistory.menstrualPeriodDuration && (
                  <div className="p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Period Duration</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.menstrualPeriodDuration} days</p>
                  </div>
                )}
              </div>
              {patient.obGyneHistory.birthControlMethod && (
                <div className="mt-4 p-4 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Birth Control Method</p>
                  <p className="text-slate-700 dark:text-slate-300">{patient.obGyneHistory.birthControlMethod}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 OB/GYN History</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No OB/GYN history recorded</p>
            </div>
          )}
        </div>
      )}

      {/* PEDIATRIC TAB */}
      {activeTab === 'pediatric' && (
        <div className="space-y-6">
          {patient.pediatricMeasurements && patient.pediatricMeasurements.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📏 Pediatric Growth Measurements</h3>
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
                    const ageMonths = calculateAgeInMonths(patient.dob!, p.dateTaken)
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
                                Age: {formatAge(patient.dob!, p.dateTaken)} ({ageMonths} months)
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
                          const ageMonths = calculateAgeInMonths(patient.dob!, p.dateTaken)
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📏 Pediatric Growth Measurements</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No pediatric measurements recorded</p>
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

          {/* OB/Gyn History */}
          {patient.obGyneHistory && patient.gender?.toLowerCase() === 'female' ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🩺 OB/Gyn History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {patient.obGyneHistory.menarche && <div><p className="text-xs text-slate-600 dark:text-slate-400">Menarche</p><p className="font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.menarche} years</p></div>}
                {patient.obGyneHistory.gravidity && <div><p className="text-xs text-slate-600 dark:text-slate-400">Gravidity</p><p className="font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.gravidity}</p></div>}
                {patient.obGyneHistory.parity && <div><p className="text-xs text-slate-600 dark:text-slate-400">Parity</p><p className="font-semibold text-slate-900 dark:text-white">{patient.obGyneHistory.parity}</p></div>}
              </div>
            </div>
          ) : null}


        </div>
      )}

      {/* INSURANCE & DOCS TAB */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          {/* PhilHealth Records */}
          <PhilHealthRecords records={patient.philHealthRecords?.filter(r => r.PhilHealthMemberType) || []} />

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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => router.push('/v2/profile/edit')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>
      </div>
    </div>
  )
}

