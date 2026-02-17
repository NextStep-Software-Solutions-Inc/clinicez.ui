'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Heart, 
  Edit2,
  BarChart3,
  List,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { PhilHealthRecords } from '@/components/patient-dashboard-v2/PhilHealthRecords'
import { formatBloodType } from '@/lib/utils'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

interface ProfileClientProps {
  patient: SerializedPatientHealthRecordsResponse
}

export default function ProfileClient({ patient }: ProfileClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [vitalsViewMode, setVitalsViewMode] = useState<'list' | 'chart'>('list')
  const [pediatricViewMode, setPediatricViewMode] = useState<'list' | 'chart'>('list')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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
        </div>
      )}

      {/* VITALS & EXAMS TAB - ABBREVIATED FOR SPACE */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="glassmorphic-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📊 Vital Signs History</h3>
              {patient.vitalSigns.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setVitalsViewMode('list')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      vitalsViewMode === 'list'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="text-sm">List</span>
                  </button>
                  <button
                    onClick={() => setVitalsViewMode('chart')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      vitalsViewMode === 'chart'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Chart</span>
                  </button>
                </div>
              )}
            </div>
            
            {patient.vitalSigns.length > 0 ? (
              <>
                {vitalsViewMode === 'list' ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                {patient.vitalSigns.map((v, i) => (
                  <div key={i} className="border rounded-lg p-4 text-sm">
                    <p className="font-semibold">{new Date(v.dateTaken).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">BP: {v.bpSystolic}/{v.bpDiastolic} | HR: {v.pulseRate} | Temp: {v.temp} | SpO₂: {v.spo2}%</p>
                  </div>
                ))}
                  </div>
                ) : (
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={patient.vitalSigns.map(v => ({
                        date: new Date(v.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        bpSystolic: v.bpSystolic,
                        pulseRate: v.pulseRate,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                        <XAxis dataKey="date" stroke="rgb(100, 116, 139)" strokeOpacity={0.5} />
                        <YAxis stroke="rgb(100, 116, 139)" strokeOpacity={0.5} />
                        <Tooltip contentStyle={{backgroundColor: 'rgb(15, 23, 42)', border: '1px solid rgb(71, 85, 105)', borderRadius: '8px', color: 'rgb(226, 232, 240)'}} />
                        <Legend />
                        <Line type="monotone" dataKey="bpSystolic" stroke="#ef4444" />
                        <Line type="monotone" dataKey="pulseRate" stroke="#06b6d4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vital signs recorded</p>
            )}
          </div>
        </div>
      )}

      {/* EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {patient.physicalExaminations.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🔍 Physical Examinations</h3>
              <div className="space-y-2">
                {patient.physicalExaminations.slice(0, 5).map((e, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                    <p className="font-semibold">{new Date(e.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Status: {e.status}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🔍 Physical Examinations</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No physical examinations recorded</p>
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
          {patient.pediatricMeasurements && patient.pediatricMeasurements.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📏 Pediatric Measurements</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPediatricViewMode('list')}
                    className={`px-3 py-1 rounded text-sm ${pediatricViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setPediatricViewMode('chart')}
                    className={`px-3 py-1 rounded text-sm ${pediatricViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    Chart
                  </button>
                </div>
              </div>
              {pediatricViewMode === 'list' ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {patient.pediatricMeasurements.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                      <p className="font-semibold">{new Date(p.dateTaken).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Length: {Number(p.length)} cm | HC: {Number(p.headCircumference)} cm</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patient.pediatricMeasurements.map(p => ({
                      date: new Date(p.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      length: p.length ? Number(p.length) : null,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="length" stroke="#06b6d4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No pediatric measurements recorded</p>
            </div>
          )}
        </div>
      )}

      {/* LIFESTYLE TAB */}
      {activeTab === 'lifestyle' && (
        <div className="space-y-6">
          {patient.personalHistory ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👤 Lifestyle & Personal History</h3>
              <div className="space-y-2">
                {patient.personalHistory.smokingStatus && <p className="text-sm"><span className="font-semibold">Smoking:</span> {patient.personalHistory.smokingStatus}</p>}
                {patient.personalHistory.alcoholStatus && <p className="text-sm"><span className="font-semibold">Alcohol:</span> {patient.personalHistory.alcoholStatus}</p>}
              </div>
            </div>
          ) : (
            <div className="glassmorphic-card p-6">
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No personal history recorded</p>
            </div>
          )}
        </div>
      )}

      {/* INSURANCE & DOCS TAB */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <PhilHealthRecords records={(patient.philHealthRecords?.filter(r => r.PhilHealthMemberType) || []) as any} />
          {patient.medicalCertificates.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📜 Certificates ({patient.medicalCertificates.length})</h3>
            </div>
          ) : null}
          {patient.referralSlips.length > 0 ? (
            <div className="glassmorphic-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📋 Referrals ({patient.referralSlips.length})</h3>
            </div>
          ) : null}
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
