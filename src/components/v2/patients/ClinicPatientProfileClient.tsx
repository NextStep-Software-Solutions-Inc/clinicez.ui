'use client'

import React, { useState, useMemo, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  MapPin,
  Phone,
  Building,
  Activity,
  ClipboardList,
  Stethoscope,
  Scissors,
  Users,
  AlertTriangle,
  Syringe,
  Accessibility,
  Baby,
  Edit2,
  Save,
  X,
  Loader2,
  Calendar,
  FolderOpen,
  FileText,
  Heart,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  mapPersonalHistoryToFormInput,
  mapPatientDataToDemographicsFormInput,
  mapVitalSignToFormInput,
  convertVitalSignsToDateObjects,
} from '@/lib/mappers/health-records-mappers'
import { DemographicsInlineForm } from './forms/DemographicsInlineForm'
import { VitalSignsInlineForm } from './forms/VitalSignsInlineForm'
import { PersonalHistoryInlineForm } from './forms/PersonalHistoryInlineForm'
import { ObGyneHistoryInlineForm } from './forms/ObGyneHistoryInlineForm'
import { MedicalConditionsInlineForm } from './forms/MedicalConditionsInlineForm'
import { FamilyMedicalHistoryInlineForm } from './forms/FamilyMedicalHistoryInlineForm'
import { PhilHealthInlineForm } from './forms/PhilHealthInlineForm'
import { AllergiesInlineForm } from './forms/AllergiesInlineForm'
import { EmergencyContactInlineForm } from './forms/EmergencyContactInlineForm'
import { AddressInlineForm } from './forms/AddressInlineForm'
import { VaccinationsInlineForm } from './forms/VaccinationsInlineForm'
import { DisabilitiesInlineForm } from './forms/DisabilitiesInlineForm'
import { SurgicalHistoryInlineForm } from './forms/SurgicalHistoryInlineForm'
import { PhysicalExamInlineForm } from './forms/PhysicalExamInlineForm'
import type { PatientHealthRecordsResponse } from '@/types/patient-profile'
import { formatBloodType, calculateDetailedAge } from '@/lib/utils'
import { DownloadPHRButton } from '@/components/v2/phr/DownloadPHRButton'
import { PatientAIInsightButton } from '@/components/v2/patients/PatientAIInsightButton'
import { calculateBMI, calculateBodyFat, getBMICategory, getBodyFatCategory, generateClinicalRemarks } from '@/app/v2/(patient-dashboard)/profile/_lib/vitals-utils'

const tabContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

interface ClinicPatientProfileClientProps {
  clinicUid: string
  patientId: number
  initialData: PatientHealthRecordsResponse
  refreshFn: () => Promise<PatientHealthRecordsResponse | null>
  appointmentsHref: string
  filesHref: string
  downloadPHRHref: string
  aiInsightConfig?: { patientId: number; clinicId?: number }
}

type TabId = 'demographics' | 'clinical' | 'history' | 'preventative' | 'obgyn'

export default function ClinicPatientProfileClient({
  clinicUid,
  patientId,
  initialData,
  refreshFn,
  appointmentsHref,
  filesHref,
  downloadPHRHref,
  aiInsightConfig,
}: ClinicPatientProfileClientProps) {
  const router = useRouter()
  const [patientData, setPatientData] = useState<PatientHealthRecordsResponse>(initialData)
  const [activeTab, setActiveTab] = useState<TabId>('demographics')
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({})
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({})

  // Batch edit form refs
  const demographicsSaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const vitalSignsSaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const personalHistorySaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const obGyneSaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const medicalSaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const familySaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)
  const philhealthSaveRef = useRef<{ submit: () => Promise<void>; hasChanges: boolean } | null>(null)

  // Mappers
  const demographicsData = useMemo(() => mapPatientDataToDemographicsFormInput(patientData), [patientData])
  const vitalSignData = useMemo(() => mapVitalSignToFormInput(patientData.latestVitals), [patientData])
  const personalHistoryData = useMemo(() => mapPersonalHistoryToFormInput(patientData.personalHistory), [patientData])
  const philHealthCurrentData = useMemo(() => {
    const record = patientData.philHealthRecords?.[0]
    if (!record) return undefined
    return {
      pin: record.pin,
      tin: record.tin || undefined,
      philSysId: record.philSysId || undefined,
      memberType: ((record as any).memberType as 'MM' | 'DD') || 'MM',
      photoUrl: record.photoUrl || undefined,
      dependents: record.PhilHealthDependents || [],
      id: record.id,
    }
  }, [patientData.philHealthRecords])

  const handleRefresh = useCallback(async () => {
    try {
      const fresh = await refreshFn()
      if (fresh) {
        setPatientData(fresh)
      }
    } catch (error) {
      console.error('Failed to refresh patient details:', error)
    }
  }, [refreshFn])

  const handleSaveSection = async (sectionId: string, saveRef: React.RefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>) => {
    if (!saveRef.current) return
    
    setSavingSections(prev => ({ ...prev, [sectionId]: true }))
    try {
      await saveRef.current.submit()
      setEditingSections(prev => ({ ...prev, [sectionId]: false }))
      await handleRefresh()
    } catch (err) {
      console.error(`Error saving section ${sectionId}:`, err)
    } finally {
      setSavingSections(prev => ({ ...prev, [sectionId]: false }))
    }
  }

  const toggleEdit = (sectionId: string, value?: boolean) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: value !== undefined ? value : !prev[sectionId]
    }))
  }

  // Calculate detailed age
  const ageString = patientData.dob ? calculateDetailedAge(patientData.dob) : 'N/A'

  // Verification Badge helper
  const renderVerificationBadge = (status: string) => {
    if (status === 'VERIFIED') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium">
          Verified
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium">
        Unverified
      </Badge>
    )
  }

  const isFemale = patientData.gender === 'FEMALE'

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Premium Patient Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-800/40 bg-gradient-to-br from-white/30 to-white/10 dark:from-slate-900/30 dark:to-slate-900/10 backdrop-blur-xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 rounded-2xl border-2 border-white dark:border-slate-700 shadow-lg shrink-0">
              {patientData.picture ? (
                <Image
                  src={patientData.picture}
                  alt={patientData.fullName}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-2xl text-xl font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {patientData.firstName?.[0]}{patientData.lastName?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {patientData.fullName}
                </h1>
                {renderVerificationBadge(patientData.verificationStatus)}
                {patientData.yakapEnlistment && (
                  <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 font-medium">
                    Yakap Enlisted
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {patientData.email} • {patientData.mobile || patientData.telephone || 'No contact number'}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">
                <span>Case: {patientData.caseNumber || 'N/A'}</span>
                <span>•</span>
                <span>Age: {ageString}</span>
                <span>•</span>
                <span>Blood: {formatBloodType(patientData.bloodType) || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0 w-full lg:w-auto">
            <button
              onClick={() => router.push(appointmentsHref)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => router.push(filesHref)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>Files</span>
            </button>
            <DownloadPHRButton printHref={downloadPHRHref} patientName={patientData.fullName} />
            {aiInsightConfig && (
              <PatientAIInsightButton
                patientId={aiInsightConfig.patientId}
                clinicId={aiInsightConfig.clinicId}
                patientName={patientData.fullName}
                size="default"
                className="flex-1 lg:flex-none shrink-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Modern Tabs Strip */}
      <div className="sticky top-20 z-20 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50 -mx-6 px-6 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <TabButton
            active={activeTab === 'demographics'}
            onClick={() => setActiveTab('demographics')}
            icon={User}
            label="Demographics & Contacts"
          />
          <TabButton
            active={activeTab === 'clinical'}
            onClick={() => setActiveTab('clinical')}
            icon={Activity}
            label="Vitals & Exams"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={ClipboardList}
            label="Medical History"
          />
          <TabButton
            active={activeTab === 'preventative'}
            onClick={() => setActiveTab('preventative')}
            icon={Syringe}
            label="Allergies & Preventative"
          />
          {isFemale && (
            <TabButton
              active={activeTab === 'obgyn'}
              onClick={() => setActiveTab('obgyn')}
              icon={Baby}
              label="OB/GYN History"
            />
          )}
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {activeTab === 'demographics' && (
          <motion.div
            key="demographics"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabContentVariants}
            className="space-y-8"
          >
            {/* Demographics Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Personal Information"
                icon={User}
                accentColor="bg-teal-500"
                editing={editingSections['demographics']}
                onEdit={() => toggleEdit('demographics', true)}
                onCancel={() => toggleEdit('demographics', false)}
                onSave={() => handleSaveSection('demographics', demographicsSaveRef)}
                saving={savingSections['demographics']}
              >
                {editingSections['demographics'] ? (
                  <DemographicsInlineForm
                    userId={patientData.userId}
                    currentData={demographicsData}
                    onSuccess={handleRefresh}
                    saveRef={demographicsSaveRef}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
                    <ViewCell label="First Name" value={patientData.firstName} />
                    <ViewCell label="Middle Name" value={patientData.middleName} />
                    <ViewCell label="Last Name" value={patientData.lastName} />
                    <ViewCell label="Suffix" value={patientData.suffix} />
                    <ViewCell label="Nickname" value={patientData.nickname} />
                    <ViewCell label="Date of Birth" value={patientData.dob ? new Date(patientData.dob).toLocaleDateString(undefined, { dateStyle: 'long' }) : null} />
                    <ViewCell label="Gender" value={patientData.gender} className="capitalize" />
                    <ViewCell label="Blood Type" value={formatBloodType(patientData.bloodType)} />
                    <ViewCell label="Civil Status" value={patientData.civilStatus} className="capitalize" />
                    <ViewCell label="Place of Birth" value={patientData.placeOfBirth} />
                    <ViewCell label="Nationality" value={patientData.nationality} />
                    <ViewCell label="Religion" value={patientData.religion} />
                    <ViewCell label="Mobile Number" value={patientData.mobile} />
                    <ViewCell label="Telephone Number" value={patientData.telephone} />
                    <ViewCell label="Email Address" value={patientData.email} />
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Addresses Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Addresses"
                icon={MapPin}
                accentColor="bg-green-500"
                editing={editingSections['addresses']}
                onEdit={() => toggleEdit('addresses', true)}
                onCancel={() => toggleEdit('addresses', false)}
                isAutoSaveForm
              >
                {editingSections['addresses'] ? (
                  <AddressInlineForm
                    userId={patientData.userId}
                    addresses={patientData.userAddresses}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-4">
                    {patientData.userAddresses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientData.userAddresses.map((addr) => (
                          <div key={addr.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative">
                            {addr.isPrimary && (
                              <Badge className="absolute top-4 right-4 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold text-[10px]">
                                Primary
                              </Badge>
                            )}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {addr.address}
                              </p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-550 dark:text-slate-400">
                                {addr.apartmentUnit && <div>Unit: {addr.apartmentUnit}</div>}
                                {addr.bldgName && <div>Bldg: {addr.bldgName}</div>}
                                {addr.street && <div>Street: {addr.street}</div>}
                                {addr.barangay && <div>Barangay: {addr.barangay}</div>}
                                <div>City: {addr.city}</div>
                                <div>State: {addr.state}</div>
                                <div>Zip: {addr.zipCode}</div>
                                <div>Country: {addr.country}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No addresses recorded. Click edit to add address.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Emergency Contacts Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Emergency Contacts"
                icon={Phone}
                accentColor="bg-blue-500"
                editing={editingSections['contacts']}
                onEdit={() => toggleEdit('contacts', true)}
                onCancel={() => toggleEdit('contacts', false)}
                isAutoSaveForm
              >
                {editingSections['contacts'] ? (
                  <EmergencyContactInlineForm
                    userId={patientData.userId}
                    contacts={patientData.userEmergencyContacts}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-4">
                    {patientData.userEmergencyContacts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientData.userEmergencyContacts.map((contact) => (
                          <div key={contact.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative">
                            {contact.isPrimary && (
                              <Badge className="absolute top-4 right-4 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold text-[10px]">
                                Primary Contact
                              </Badge>
                            )}
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-xs text-slate-550 dark:text-slate-400">
                                Relationship: <span className="font-semibold text-slate-700 dark:text-slate-350">{contact.relationship}</span>
                              </p>
                              <p className="text-xs text-slate-550 dark:text-slate-400">
                                Phone: <span className="font-semibold text-slate-700 dark:text-slate-350">{contact.phone}</span>
                              </p>
                              {contact.address && (
                                <p className="text-xs text-slate-550 dark:text-slate-400">
                                  Address: <span className="font-semibold text-slate-700 dark:text-slate-350">{contact.address}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No emergency contacts recorded. Click edit to add contact.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* PhilHealth Insurance Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="PhilHealth & Insurance"
                icon={Building}
                accentColor="bg-indigo-500"
                editing={editingSections['philhealth']}
                onEdit={() => toggleEdit('philhealth', true)}
                onCancel={() => toggleEdit('philhealth', false)}
                onSave={() => handleSaveSection('philhealth', philhealthSaveRef)}
                saving={savingSections['philhealth']}
              >
                {editingSections['philhealth'] ? (
                  <PhilHealthInlineForm
                    userId={patientData.userId}
                    currentData={philHealthCurrentData as any}
                    onSuccess={handleRefresh}
                    saveRef={philhealthSaveRef}
                  />
                ) : (
                  <div className="space-y-6">
                    {patientData.philHealthRecords.length > 0 ? (
                      patientData.philHealthRecords.map((record) => (
                        <div key={record.id} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <ViewCell label="PIN (PhilHealth ID)" value={record.pin} />
                            <ViewCell label="TIN" value={record.tin} />
                            <ViewCell label="PhilSys ID" value={record.philSysId} />
                            <ViewCell
                              label="Member Type"
                              value={((record as any).memberType) === 'MM' ? 'Formal Member' : 'Dependent'}
                            />
                          </div>

                          {/* Dependents list */}
                          {record.PhilHealthDependents && record.PhilHealthDependents.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Registered Dependents
                              </h4>
                              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                <table className="min-w-full text-xs text-left">
                                  <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-500 uppercase">
                                    <tr>
                                      <th className="px-4 py-3">Full Name</th>
                                      <th className="px-4 py-3">Relationship</th>
                                      <th className="px-4 py-3">Gender</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                                    {record.PhilHealthDependents.map((dep) => (
                                      <tr key={dep.id}>
                                        <td className="px-4 py-3">{dep.firstName} {dep.lastName}</td>
                                        <td className="px-4 py-3 capitalize">{dep.relationship ? dep.relationship.toLowerCase() : '—'}</td>
                                        <td className="px-4 py-3 capitalize">{dep.gender ? dep.gender.toLowerCase() : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No PhilHealth records added yet. Click edit to record insurance.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'clinical' && (
          <motion.div
            key="clinical"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabContentVariants}
            className="space-y-8"
          >
            {/* Vitals Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Vital Signs"
                icon={Activity}
                accentColor="bg-red-500"
                editing={editingSections['vital-signs']}
                onEdit={() => toggleEdit('vital-signs', true)}
                onCancel={() => toggleEdit('vital-signs', false)}
                onSave={() => handleSaveSection('vital-signs', vitalSignsSaveRef)}
                saving={savingSections['vital-signs']}
              >
                {editingSections['vital-signs'] ? (
                  <VitalSignsInlineForm
                    userId={patientData.userId}
                    currentData={vitalSignData as any}
                    onSuccess={handleRefresh}
                    saveRef={vitalSignsSaveRef}
                  />
                ) : (
                  <div className="space-y-6">
                    {patientData.latestVitals ? (
                      <div className="space-y-6">
                        {/* Metric Display */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <VitalMetricBox
                            label="BP"
                            value={patientData.latestVitals.bpSystolic && patientData.latestVitals.bpDiastolic ? `${patientData.latestVitals.bpSystolic}/${patientData.latestVitals.bpDiastolic}` : '—'}
                            unit="mmHg"
                            color="text-red-500"
                          />
                          <VitalMetricBox
                            label="Heart Rate"
                            value={patientData.latestVitals.pulseRate ? String(patientData.latestVitals.pulseRate) : '—'}
                            unit="bpm"
                            color="text-rose-500"
                          />
                          <VitalMetricBox
                            label="Temperature"
                            value={patientData.latestVitals.temp ? `${patientData.latestVitals.temp}°` : '—'}
                            unit="°C"
                            color="text-orange-500"
                          />
                          <VitalMetricBox
                            label="Weight"
                            value={patientData.latestVitals.weight ? String(patientData.latestVitals.weight) : '—'}
                            unit="kg"
                            color="text-emerald-500"
                          />
                          <VitalMetricBox
                            label="Height"
                            value={patientData.latestVitals.height ? String(patientData.latestVitals.height) : '—'}
                            unit="cm"
                            color="text-blue-500"
                          />
                        </div>

                        {/* Extended Anthropometrics */}
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                            Anthropometrics & Secondary Vitals
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <ViewCell label="SpO₂ (O2 Saturation)" value={patientData.latestVitals.spo2 ? `${patientData.latestVitals.spo2}%` : null} />
                            <ViewCell label="Resp Rate" value={patientData.latestVitals.respRate ? `${patientData.latestVitals.respRate} br/min` : null} />
                            <ViewCell label="BMI" value={patientData.latestVitals.bmi} />
                            <ViewCell label="Z-Score" value={(patientData.latestVitals as any)?.zScore} />
                            <ViewCell label="Length/Height" value={(patientData.latestVitals as any)?.length ? `${(patientData.latestVitals as any).length} cm` : null} />
                            <ViewCell label="Head Circ." value={(patientData.latestVitals as any)?.headCircumference ? `${(patientData.latestVitals as any).headCircumference} cm` : null} />
                            <ViewCell label="Waist Circ." value={(patientData.latestVitals as any)?.waistCircumference ? `${(patientData.latestVitals as any).waistCircumference} cm` : null} />
                            <ViewCell label="Hip Circ." value={(patientData.latestVitals as any)?.hipCircumference ? `${(patientData.latestVitals as any).hipCircumference} cm` : null} />
                          </div>
                        </div>

                        {/* Vitals History */}
                        {patientData.vitalSigns.length > 1 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Vitals Log History
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                              <table className="min-w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-500 uppercase">
                                  <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">BP</th>
                                    <th className="px-4 py-3">HR</th>
                                    <th className="px-4 py-3">Temp</th>
                                    <th className="px-4 py-3">SpO2</th>
                                    <th className="px-4 py-3">Weight</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                                  {patientData.vitalSigns.slice(1, 5).map((v) => (
                                    <tr key={v.id}>
                                      <td className="px-4 py-3">{new Date(v.dateTaken).toLocaleDateString()}</td>
                                      <td className="px-4 py-3">{v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                                      <td className="px-4 py-3">{v.pulseRate || '—'} bpm</td>
                                      <td className="px-4 py-3">{v.temp || '—'} °C</td>
                                      <td className="px-4 py-3">{v.spo2 || '—'}%</td>
                                      <td className="px-4 py-3">{v.weight || '—'} kg</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No vitals records on file. Click edit to add vitals.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Physical Examinations Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Physical Examinations"
                icon={Activity}
                accentColor="bg-cyan-500"
                editing={editingSections['physical-exam']}
                onEdit={() => toggleEdit('physical-exam', true)}
                onCancel={() => toggleEdit('physical-exam', false)}
                isAutoSaveForm
              >
                {editingSections['physical-exam'] ? (
                  <PhysicalExamInlineForm
                    patientId={patientData.id}
                    currentData={patientData.physicalExaminations?.[0] || {}}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-4">
                    {patientData.physicalExaminations.length > 0 ? (
                      <div className="space-y-3">
                        {patientData.physicalExaminations.map((exam) => {
                          const findings = [
                            { label: 'General Survey', value: exam.generalSurveyRemarks },
                            { label: 'HEENT', value: exam.heentRemarks },
                            { label: 'Chest', value: exam.chestRemarks },
                            { label: 'Heart', value: exam.heartRemarks },
                            { label: 'Abdomen', value: exam.abdomenRemarks },
                            { label: 'GU', value: exam.guRemarks },
                            { label: 'Skin', value: exam.skinRemarks },
                            { label: 'Neuro', value: exam.neuroRemarks },
                            { label: 'Rectal', value: exam.rectalRemarks },
                          ].filter((f) => !!f.value)

                          return (
                            <div key={exam.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                              <div className="flex items-center justify-between gap-4 mb-3">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                  Date: {new Date(exam.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </span>
                              </div>
                              {findings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                  {findings.map((f, idx) => (
                                    <div key={idx} className="space-y-0.5">
                                      <span className="font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{f.label}</span>
                                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{f.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
                                  No anomalies recorded.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No physical examinations logged. Click edit to record exam.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabContentVariants}
            className="space-y-8"
          >
            {/* Lifestyle & Social Habits */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Personal History & Lifestyle"
                icon={ClipboardList}
                accentColor="bg-orange-500"
                editing={editingSections['personal-history']}
                onEdit={() => toggleEdit('personal-history', true)}
                onCancel={() => toggleEdit('personal-history', false)}
                onSave={() => handleSaveSection('personal-history', personalHistorySaveRef)}
                saving={savingSections['personal-history']}
              >
                {editingSections['personal-history'] ? (
                  <PersonalHistoryInlineForm
                    userId={patientData.userId}
                    currentData={personalHistoryData}
                    onSuccess={handleRefresh}
                    saveRef={personalHistorySaveRef}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
                    <ViewCell label="Smoking Status" value={patientData.personalHistory?.smokingStatus} className="capitalize" />
                    <ViewCell label="Packs per Year" value={patientData.personalHistory?.numberOfPacksPerYear} />
                    <ViewCell label="Alcohol Intake" value={patientData.personalHistory?.alcoholStatus} className="capitalize" />
                    <ViewCell label="Bottles per Day" value={patientData.personalHistory?.numberOfBottlesPerDay ? String(patientData.personalHistory.numberOfBottlesPerDay) : null} />
                    <ViewCell label="Drug Use Status" value={patientData.personalHistory?.illicitDrugUse} className="capitalize" />
                    <ViewCell label="Sexually Active" value={patientData.personalHistory?.sexuallyActive} className="capitalize" />
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Medical Conditions */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Medical Conditions"
                icon={Stethoscope}
                accentColor="bg-green-500"
                editing={editingSections['medical-history']}
                onEdit={() => toggleEdit('medical-history', true)}
                onCancel={() => toggleEdit('medical-history', false)}
                onSave={() => handleSaveSection('medical-history', medicalSaveRef)}
                saving={savingSections['medical-history']}
              >
                {editingSections['medical-history'] ? (
                  <MedicalConditionsInlineForm
                    userId={patientData.userId}
                    currentConditions={patientData.medicalHistories?.map((h) => ({
                      conditionId: h.conditionId,
                      details: h.details || undefined,
                    }))}
                    onSuccess={handleRefresh}
                    saveRef={medicalSaveRef}
                  />
                ) : (
                  <div className="space-y-3">
                    {patientData.medicalHistories.length > 0 ? (
                      patientData.medicalHistories.map((hist) => (
                        <div key={hist.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {hist.condition}
                            </p>
                            {hist.details && (
                              <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
                                Details: {hist.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No diagnosed medical conditions listed. Click edit to add condition.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Surgical History */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Surgical History"
                icon={Scissors}
                accentColor="bg-orange-500"
                editing={editingSections['surgical-history']}
                onEdit={() => toggleEdit('surgical-history', true)}
                onCancel={() => toggleEdit('surgical-history', false)}
                isAutoSaveForm
              >
                {editingSections['surgical-history'] ? (
                  <SurgicalHistoryInlineForm
                    userId={patientData.userId}
                    surgeries={patientData.surgicalHistories}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-3">
                    {patientData.surgicalHistories.length > 0 ? (
                      patientData.surgicalHistories.map((surg) => (
                        <div key={surg.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {surg.operationName}
                            </p>
                            <span className="text-xs text-slate-400 font-medium">
                              {surg.operationDate ? new Date(surg.operationDate).toLocaleDateString() : '—'}
                            </span>
                          </div>
                          {surg.notes && (
                            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                              Notes: {surg.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No recorded surgical procedures. Click edit to manage surgical records.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Family Medical History */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Family History"
                icon={Users}
                accentColor="bg-teal-500"
                editing={editingSections['family-history']}
                onEdit={() => toggleEdit('family-history', true)}
                onCancel={() => toggleEdit('family-history', false)}
                onSave={() => handleSaveSection('family-history', familySaveRef)}
                saving={savingSections['family-history']}
              >
                {editingSections['family-history'] ? (
                  <FamilyMedicalHistoryInlineForm
                    userId={patientData.userId}
                    currentHistory={patientData.familyMedicalHistories?.map((h) => ({
                      conditionId: h.conditionId,
                      details: h.details || undefined,
                    }))}
                    onSuccess={handleRefresh}
                    saveRef={familySaveRef}
                  />
                ) : (
                  <div className="space-y-3">
                    {patientData.familyMedicalHistories.length > 0 ? (
                      patientData.familyMedicalHistories.map((fam) => (
                        <div key={fam.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3">
                          <Users className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {fam.condition}
                            </p>
                            {fam.details && (
                              <p className="text-xs text-slate-550 dark:text-slate-405 mt-0.5">
                                Relationship & Notes: {fam.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No family health records logged. Click edit to add family records.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'preventative' && (
          <motion.div
            key="preventative"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabContentVariants}
            className="space-y-8"
          >
            {/* Allergies Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Allergies"
                icon={AlertTriangle}
                accentColor="bg-rose-500"
                editing={editingSections['allergies']}
                onEdit={() => toggleEdit('allergies', true)}
                onCancel={() => toggleEdit('allergies', false)}
                isAutoSaveForm
              >
                {editingSections['allergies'] ? (
                  <AllergiesInlineForm
                    userId={patientData.userId}
                    allergies={patientData.userAllergies}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-3">
                    {patientData.userAllergies.length > 0 ? (
                      patientData.userAllergies.map((all) => (
                        <div key={all.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              Allergen: {all.allergen}
                            </p>
                            <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
                              Reaction: <span className="font-semibold text-slate-700 dark:text-slate-355">{all.reaction}</span>
                            </p>
                            {all.notes && (
                              <p className="text-xs text-slate-550 dark:text-slate-450 mt-0.5">
                                Notes: {all.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No documented allergies. Click edit to add allergen.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Vaccinations Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Vaccination & Immunization"
                icon={Syringe}
                accentColor="bg-blue-500"
                editing={editingSections['vaccinations']}
                onEdit={() => toggleEdit('vaccinations', true)}
                onCancel={() => toggleEdit('vaccinations', false)}
                isAutoSaveForm
              >
                {editingSections['vaccinations'] ? (
                  <VaccinationsInlineForm
                    userId={patientData.userId}
                    vaccinations={patientData.userVaccinations}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-4">
                    {patientData.userVaccinations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientData.userVaccinations.map((vac) => (
                          <div key={vac.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3">
                            <Syringe className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {vac.vaccine}
                              </p>
                              <div className="text-xs text-slate-550 dark:text-slate-400 space-y-0.5">
                                <div>Dose: <span className="font-semibold text-slate-700 dark:text-slate-350">{vac.dose}</span> ({vac.route})</div>
                                <div>Date Administered: <span className="font-semibold text-slate-700 dark:text-slate-350">{new Date(vac.dateGiven).toLocaleDateString()}</span></div>
                                {vac.administeredBy && <div>Given By: {vac.administeredBy}</div>}
                                {vac.notes && <div>Notes: {vac.notes}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No immunizations logged. Click edit to record vaccination.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>

            {/* Disabilities Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="Disabilities & Chronic Illnesses"
                icon={Accessibility}
                accentColor="bg-purple-500"
                editing={editingSections['disabilities']}
                onEdit={() => toggleEdit('disabilities', true)}
                onCancel={() => toggleEdit('disabilities', false)}
                isAutoSaveForm
              >
                {editingSections['disabilities'] ? (
                  <DisabilitiesInlineForm
                    userId={patientData.userId}
                    disabilities={patientData.userDisabilities}
                    onSuccess={handleRefresh}
                  />
                ) : (
                  <div className="space-y-4">
                    {patientData.userDisabilities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientData.userDisabilities.map((dis) => (
                          <div key={dis.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3">
                            <Accessibility className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {dis.disability}
                              </p>
                              <div className="text-xs text-slate-550 dark:text-slate-400 space-y-0.5">
                                <div>Severity: <span className="font-semibold text-slate-705 dark:text-slate-300 capitalize">{dis.severity.toLowerCase()}</span></div>
                                <div>Diagnosed: {dis.dateDiagnosed ? new Date(dis.dateDiagnosed).toLocaleDateString() : '—'}</div>
                                {dis.diagnosedBy && <div>By: {dis.diagnosedBy}</div>}
                                <div>Status: <span className="font-semibold text-slate-700 dark:text-slate-300">{dis.isManaged ? 'Under Management' : 'Unmanaged'}</span></div>
                                {dis.notes && <div>Notes: {dis.notes}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        No disabilities recorded. Click edit to add records.
                      </div>
                    )}
                  </div>
                )}
              </CardContainer>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'obgyn' && isFemale && (
          <motion.div
            key="obgyn"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabContentVariants}
            className="space-y-8"
          >
            {/* OB/GYN Card */}
            <motion.div variants={cardVariants}>
              <CardContainer
                title="OB/GYN History"
                icon={Baby}
                accentColor="bg-rose-500"
                editing={editingSections['ob-gyne']}
                onEdit={() => toggleEdit('ob-gyne', true)}
                onCancel={() => toggleEdit('ob-gyne', false)}
                onSave={() => handleSaveSection('ob-gyne', obGyneSaveRef)}
                saving={savingSections['ob-gyne']}
              >
                {editingSections['ob-gyne'] ? (
                  <ObGyneHistoryInlineForm
                    userId={patientData.userId}
                    currentData={patientData.obGyneHistory as any}
                    onSuccess={handleRefresh}
                    saveRef={obGyneSaveRef}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
                    <ViewCell label="Menarche Age" value={patientData.obGyneHistory?.menarche ? `${patientData.obGyneHistory.menarche} years` : null} />
                    <ViewCell label="LMP (Last Menstrual Period)" value={patientData.obGyneHistory?.lastMenstrualPeriod ? new Date(patientData.obGyneHistory.lastMenstrualPeriod).toLocaleDateString() : null} />
                    <ViewCell label="Menopause Status" value={patientData.obGyneHistory?.menopauseStatus} className="uppercase" />
                    <ViewCell label="Menopause Age" value={patientData.obGyneHistory?.menopauseAge ? `${patientData.obGyneHistory.menopauseAge} years` : null} />
                    <ViewCell label="Gravidity (Total Pregnancies)" value={patientData.obGyneHistory?.gravidity} />
                    <ViewCell label="Parity (Delivered)" value={patientData.obGyneHistory?.parity} />
                    <ViewCell label="Full Term Deliveries" value={patientData.obGyneHistory?.fullTerm} />
                    <ViewCell label="Premature Deliveries" value={patientData.obGyneHistory?.premature} />
                    <ViewCell label="Abortions/Miscarriages" value={patientData.obGyneHistory?.abortion} />
                    <ViewCell label="Living Children" value={patientData.obGyneHistory?.livingChildren} />
                    <ViewCell label="Delivery Type Preference" value={patientData.obGyneHistory?.typeOfDelivery} className="capitalize" />
                    <ViewCell label="History of Pre-Eclampsia" value={patientData.obGyneHistory?.hasPreEclampsia ? 'Yes' : 'No'} />
                  </div>
                )}
              </CardContainer>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* UI Helper: Tab Button */
interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<any>
  label: string
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-tight whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus:outline-none"
    >
      {active && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 bg-teal-600 dark:bg-teal-500 rounded-xl shadow-md shadow-teal-600/25 dark:shadow-teal-500/10"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon className={`w-4 h-4 transition-colors duration-200 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
        <span className={`transition-colors duration-200 ${active ? 'text-white' : 'text-slate-650 dark:text-slate-450'}`}>{label}</span>
      </span>
    </button>
  )
}

/* UI Helper: Card Container */
interface CardContainerProps {
  title: string
  icon: React.ComponentType<any>
  accentColor: string
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave?: () => void
  saving?: boolean
  isAutoSaveForm?: boolean
  children: React.ReactNode
}

function CardContainer({
  title,
  icon: Icon,
  accentColor,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving = false,
  isAutoSaveForm = false,
  children
}: CardContainerProps) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950/80 shadow-md p-6 relative overflow-hidden transition-all hover:shadow-lg">
      {/* Accent strip */}
      <div className={`absolute top-0 left-0 w-full h-[3px] ${accentColor}`}></div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${accentColor}/10 shrink-0`}>
            <Icon className="w-5 h-5 text-slate-700 dark:text-slate-350" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">
            {title}
          </h3>
        </div>

        {/* Edit/Action triggers */}
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAutoSaveForm ? 'Manage' : 'Edit'}</span>
          </button>
        ) : (
          isAutoSaveForm && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          )
        )}
      </div>

      {/* Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={editing ? 'edit' : 'view'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save controls for batch cards */}
      {editing && !isAutoSaveForm && (
        <div className="flex justify-end gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/10"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* UI Helper: Read-only Data Field Cell */
interface ViewCellProps {
  label: string
  value: string | number | null | undefined
  className?: string
}

function ViewCell({ label, value, className = '' }: ViewCellProps) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : String(value)
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-sm font-semibold text-slate-800 dark:text-slate-200 ${className}`}>
        {displayValue}
      </p>
    </div>
  )
}

/* UI Helper: Vital Signs Box */
interface VitalMetricBoxProps {
  label: string
  value: string
  unit: string
  color: string
}

function VitalMetricBox({ label, value, unit, color }: VitalMetricBoxProps) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-850 p-4 text-center bg-slate-50/20 dark:bg-slate-900/10">
      <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl font-extrabold leading-none ${color}`}>
        {value}
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
        {unit}
      </p>
    </div>
  )
}
