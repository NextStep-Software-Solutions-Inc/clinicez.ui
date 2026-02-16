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
  CheckCircle
} from 'lucide-react'
import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
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
  philHealthRecords: PhilHealthRecord[]
  procedureHistory: ProcedureUsageHistory[]
  medicalCertificates: CertificateData[]
  referralSlips: ReferralData[]
}
  
export default function PatientProfilePage() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientHealthRecords | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPatientHealthRecords()
      setPatient(data)
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
    { id: 'vitals', label: 'Vitals & Exams', icon: '❤️' },
    { id: 'lifestyle', label: 'Lifestyle & Social', icon: '👤' },
    { id: 'insurance', label: 'Insurance & Docs', icon: '📄' },
  ]

  return (
    <div className="w-full">
      {/* Full-Width Header Background */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-gradient-to-b from-slate-50 via-blue-50 to-transparent dark:from-slate-950 dark:via-blue-950 dark:to-transparent backdrop-blur-lg mb-8 -mx-8 px-8 pt-4 pb-6">
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
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
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">❤️ Latest Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {patient.latestVitals.height && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Height</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.height} cm</p></div>}
                {patient.latestVitals.weight && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Weight</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.weight} kg</p></div>}
                {patient.latestVitals.bmi && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">BMI</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.bmi.toFixed(1)}</p></div>}
                {patient.latestVitals.temp && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Temp</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.temp}°C</p></div>}
                {patient.latestVitals.bpSystolic && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">BP</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.bpSystolic}/{patient.latestVitals.bpDiastolic}</p></div>}
                {patient.latestVitals.pulseRate && <div className="text-center p-3 rounded-lg bg-slate-100/50 dark:bg-white/5"><p className="text-xs text-slate-600 dark:text-slate-400">Pulse</p><p className="font-semibold text-slate-900 dark:text-white">{patient.latestVitals.pulseRate} bpm</p></div>}
              </div>
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📊 Vital Signs History</h3>
            {patient.vitalSigns.length > 0 ? (
              <div className="space-y-2">
                {patient.vitalSigns.map((v, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(v.dateTaken).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">BP: {v.bpSystolic}/{v.bpDiastolic} | HR: {v.pulseRate} | Temp: {v.temp}°C</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vital signs recorded</p>
            )}
          </div>

          {/* Physical Exams */}
          {patient.physicalExaminations.length > 0 && (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🔍 Physical Examinations</h3>
              <div className="space-y-2">
                {patient.physicalExaminations.map((e, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(e.createdAt).toLocaleDateString()}</p>
                    {e.status && <p className="text-xs text-slate-600 dark:text-slate-400">Status: {e.status}</p>}
                  </div>
                ))}
              </div>
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

          {/* Pediatric Measurements */}
          {patient.pediatricMeasurements.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 Pediatric Measurements</h3>
              <div className="space-y-2">
                {patient.pediatricMeasurements.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(p.dateTaken).toLocaleDateString()}</p>
                    {p.length && <p className="text-xs text-slate-600 dark:text-slate-400">Length: {p.length.toString()} cm</p>}
                    {p.headCircumference && <p className="text-xs text-slate-600 dark:text-slate-400">HC: {p.headCircumference.toString()} cm</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 Pediatric Measurements</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No pediatric measurements recorded</p>
            </div>
          )}
        </div>
      )}

      {/* INSURANCE & DOCS TAB */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          {/* PhilHealth Records */}
          {patient.philHealthRecords.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🏥 PhilHealth Records</h3>
              <div className="space-y-2">
                {patient.philHealthRecords.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white">{p.pin}</p>
                    {p.philSysId && <p className="text-xs text-slate-600 dark:text-slate-400">PhilSys ID: {p.philSysId}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🏥 PhilHealth Records</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No PhilHealth records found</p>
            </div>
          )}

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

      {/* Edit Profile Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push('/v2/profile/edit')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>
      </div>
    </div>
  )
}

