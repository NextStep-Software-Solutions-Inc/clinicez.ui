'use client'

import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { mutate } from 'swr'
import useSound from 'use-sound'
import dayjs from '@/lib/day-utils'
import { bookAppointmentAtom } from '@/state/book-appointment'
import { createAppointmentAction } from '@/actions/appointments/appointments.action'
import { uploadMediaAction } from '@/actions/blob.action'
import { useHPs } from '@/hooks/useHP'
import { useTimeSlots } from '@/hooks/useTimeSlots'
import { useClinicServiceCategories } from '@/hooks/useClinicServiceCategory'
import { useClinicAppointmentTypes } from '@/hooks/useOrgAppointmentType'
import { useClinicAppointmentModes } from '@/hooks/useOrgAppointmentMode'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { ArrowLeft, ArrowRight, Check, Calendar, Paperclip, Stethoscope, FileCheck, X, CheckCircle2, Loader2 } from 'lucide-react'
import AppointmentCalendar from '@/components/appointment/AppointmentCalendar'
import VacantTimeSlot from '@/components/appointment/VacantTimeSlot'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from '@/components/extention/file-upload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookAppointmentWizardProps {
  clinicUid: string
  clinicName: string
  termsUrl: string | null
  privacyUrl: string | null
}

const DEFAULT_TERMS_URL =
  'https://www.healthcare.gov.au/sites/default/files/2021-04/Terms%20and%20Conditions%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf'
const DEFAULT_PRIVACY_URL =
  'https://www.healthcare.gov.au/sites/default/files/2021-04/Privacy%20Policy%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf'

const STEPS = [
  { id: 1, label: 'Complaint' },
  { id: 2, label: 'Doctor' },
  { id: 3, label: 'Schedule' },
  { id: 4, label: 'Consent' },
  { id: 5, label: 'Review' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepIndicator({ step, label, state }: { step: number; label: string; state: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
          state === 'done'
            ? 'bg-blue-600 border-blue-600 text-white'
            : state === 'active'
            ? 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 dark:text-blue-400'
            : 'bg-white/30 dark:bg-slate-800/30 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
        }`}
      >
        {state === 'done' ? <Check className="w-4 h-4" /> : step}
      </div>
      <span
        className={`text-xs font-medium hidden sm:block ${
          state === 'active'
            ? 'text-blue-600 dark:text-blue-400'
            : state === 'done'
            ? 'dark:text-slate-300 text-slate-600'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function StepConnector({ done }: { done: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mt-4 transition-colors ${done ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
  )
}

// ---------------------------------------------------------------------------
// Step 1 – Complaint + service/mode/type + attachments
// ---------------------------------------------------------------------------

function Step1Complaint({
  clinicUid,
  onNext,
}: {
  clinicUid: string
  onNext: () => void
}) {
  const [form, setForm] = useAtom(bookAppointmentAtom)
  const [subject, setSubject] = useState(form.subject ?? '')
  const [complaint, setComplaint] = useState(form.chiefComplaint ?? '')
  const [files, setFiles] = useState<File[]>(form.attachments ?? [])

  const { data: serviceCategories } = useClinicServiceCategories(clinicUid)
  const { data: appointmentTypes } = useClinicAppointmentTypes(clinicUid)
  const { data: appointmentModes } = useClinicAppointmentModes(clinicUid)

  const canProceed = subject.trim().length >= 3 && !!form.modeId && !!form.appointmentTypeId && !!form.serviceId

  const handleNext = () => {
    setForm((prev) => ({ ...prev, subject: subject.trim(), chiefComplaint: complaint.trim(), attachments: files }))
    onNext()
  }

  const dropZoneConfig = { maxFiles: 5, maxSize: 1024 * 1024 * 4, multiple: true }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">What brings you in?</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">Tell us about your concern so we can prepare for your visit.</p>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Persistent headache for 3 days"
          className="w-full px-4 py-2.5 rounded-xl dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200 border text-sm dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        {subject.trim().length > 0 && subject.trim().length < 3 && (
          <p className="mt-1 text-xs text-red-500">Subject must be at least 3 characters.</p>
        )}
      </div>

      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
          Chief Complaint / Message
        </label>
        <textarea
          rows={4}
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Describe your symptoms, when they started, what makes them better or worse…"
          className="w-full px-4 py-2.5 rounded-xl dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200 border text-sm dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
        />
      </div>

      {/* Service / Mode / Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
            Appointment Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.modeId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, modeId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(appointmentModes ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
            Consultation Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.appointmentTypeId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, appointmentTypeId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(appointmentTypes ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
            Service <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.serviceId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, serviceId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {(serviceCategories ?? []).map((cat) => (
                <SelectGroup key={cat.id}>
                  <SelectLabel>{cat.name}</SelectLabel>
                  {(cat.Services ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
          Attachments <span className="text-xs font-normal dark:text-slate-500 text-slate-400">(optional, up to 5 files, max 4 MB each)</span>
        </label>
        <FileUploader
          value={files}
          onValueChange={(f) => setFiles(f ?? [])}
          dropzoneOptions={dropZoneConfig}
          className="relative dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200 border rounded-xl"
        >
          <FileInput className="outline-dashed outline-1 dark:outline-white/20 outline-slate-300 rounded-lg m-2">
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Paperclip className="w-7 h-7 dark:text-slate-400 text-slate-400" />
              <p className="text-sm dark:text-slate-400 text-slate-500">
                <span className="font-medium">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs dark:text-slate-500 text-slate-400">SVG, PNG, JPG or GIF (max 4 MB each)</p>
            </div>
          </FileInput>
          <FileUploaderContent>
            {files.map((file, i) => (
              <FileUploaderItem key={i} index={i}>
                <Paperclip className="h-4 w-4 stroke-current shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
              </FileUploaderItem>
            ))}
          </FileUploaderContent>
        </FileUploader>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 – Healthcare Provider (optional)
// ---------------------------------------------------------------------------

function Step2Provider({ clinicUid, onNext, onBack }: { clinicUid: string; onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useAtom(bookAppointmentAtom)
  const { data: hps } = useHPs({ clinicUid })

  const groupedHps = useMemo(() => {
    return (hps ?? []).reduce(
      (acc, hp) => {
        const existing = acc.find((a) => a.hpTypeName === hp.HPType.name)
        if (existing) existing.hps.push(hp)
        else acc.push({ hpTypeName: hp.HPType.name, hps: [hp] })
        return acc
      },
      [] as { hpTypeName: string; hps: NonNullable<typeof hps> }[]
    )
  }, [hps])

  const getHpLabel = (hp: NonNullable<typeof hps>[number]) =>
    [hp.HPProfile?.title, hp.HPProfile?.name || `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(), hp.HPProfile?.suffix]
      .filter(Boolean)
      .join(' ')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Choose Your Doctor</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">
          Select a preferred healthcare provider, or skip to let the clinic assign one.
        </p>
      </div>

      {hps && hps.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {/* No preference option */}
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, hpId: undefined, hpUserId: undefined }))}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              !form.hpId
                ? 'border-blue-500 dark:bg-blue-950/30 bg-blue-50'
                : 'dark:border-white/10 border-slate-200 dark:bg-slate-800/40 bg-white/40 dark:hover:bg-slate-800/60 hover:bg-white/60'
            }`}
          >
            <div className="w-10 h-10 rounded-full dark:bg-slate-700/60 bg-slate-100 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 dark:text-slate-400 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold dark:text-white text-slate-900 text-sm">No preference</p>
              <p className="text-xs dark:text-slate-400 text-slate-500">Let the clinic assign a doctor</p>
            </div>
            {!form.hpId && <Check className="w-5 h-5 text-blue-600 ml-auto shrink-0" />}
          </button>

          {groupedHps.map((group) => (
            <div key={group.hpTypeName}>
              <p className="text-xs font-semibold uppercase tracking-wide dark:text-slate-500 text-slate-400 mb-2 px-1">{group.hpTypeName}</p>
              {group.hps.map((hp) => {
                const isSelected = form.hpId === hp.id
                return (
                  <button
                    key={hp.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, hpId: hp.id, hpUserId: hp.User?.userId }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all mb-2 ${
                      isSelected
                        ? 'border-blue-500 dark:bg-blue-950/30 bg-blue-50'
                        : 'dark:border-white/10 border-slate-200 dark:bg-slate-800/40 bg-white/40 dark:hover:bg-slate-800/60 hover:bg-white/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold dark:text-white text-slate-900 text-sm truncate">{getHpLabel(hp)}</p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">{group.hpTypeName}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center dark:bg-slate-800/40 bg-slate-100/60 rounded-xl">
          <Stethoscope className="w-10 h-10 mx-auto dark:text-slate-500 text-slate-400 mb-2" />
          <p className="text-sm dark:text-slate-400 text-slate-500">No healthcare providers are available for this clinic.</p>
          <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">You can proceed and the clinic will assign a doctor.</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-slate-700/60 bg-slate-100 dark:text-white text-slate-900 font-semibold text-sm dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={onNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
          {form.hpId ? 'Next' : 'Skip'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 – Time Slot (optional)
// ---------------------------------------------------------------------------

function Step3Schedule({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useAtom(bookAppointmentAtom)
  const { appointmentTypeId, serviceId, hpUserId, hpId } = form

  const { data: timeSlots, isValidating } = useTimeSlots({
    appointmentTypeId,
    userId: hpUserId ?? '',
    hpId: Number(hpId),
    serviceId,
  })

  const availableDates = useMemo(
    () =>
      isValidating ? [] : (timeSlots?.data?.filter((a) => a.status).map((a) => dayjs(a.date).startOf('day').toDate()) ?? []),
    [isValidating, timeSlots?.data]
  )

  const availableTimeSlots = useMemo(
    () =>
      isValidating
        ? []
        : (timeSlots?.data
            ?.find((a) => dayjs(a.date).isSame(form.preferredDate, 'day'))
            ?.timeSlots.map((ts) => ({ start: dayjs(ts.start).toDate(), end: dayjs(ts.end).toDate() })) ?? []),
    [isValidating, timeSlots?.data, form.preferredDate]
  )

  const noHpSelected = !form.hpUserId || !form.hpId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Pick a Schedule</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">
          Choose a date and time that works for you, or skip to let the clinic decide.
        </p>
      </div>

      {noHpSelected ? (
        <div className="rounded-xl dark:bg-amber-900/20 bg-amber-50 dark:border-amber-700/30 border-amber-300 border p-4 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No doctor selected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Go back to select a doctor to view available time slots, or skip this step.</p>
          </div>
        </div>
      ) : isValidating ? (
        <div className="flex items-center justify-center py-12 gap-3 dark:text-slate-400 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading available slots…</span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
          <AppointmentCalendar
            availableDates={availableDates}
            preferredDate={form.preferredDate}
            onSelect={(date) => setForm((p) => ({ ...p, preferredDate: date, selectedTimeSlot: undefined }))}
          />
          <VacantTimeSlot
            timeSlots={availableTimeSlots}
            selectedTimeSlot={form.selectedTimeSlot}
            onSelect={(ts) => setForm((p) => ({ ...p, selectedTimeSlot: ts }))}
          />
        </div>
      )}

      {form.selectedTimeSlot && (
        <div className="flex items-center gap-2 dark:bg-blue-900/20 bg-blue-50 dark:border-blue-700/30 border-blue-300 border rounded-xl px-4 py-3">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm dark:text-blue-200 text-blue-800 font-medium">
            {form.preferredDate && dayjs(form.preferredDate).format('ddd, MMM D, YYYY')} ·{' '}
            {dayjs(form.selectedTimeSlot.start).format('LT')} – {dayjs(form.selectedTimeSlot.end).format('LT')}
          </p>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, selectedTimeSlot: undefined, preferredDate: undefined }))}
            className="ml-auto dark:text-slate-400 text-slate-500 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-slate-700/60 bg-slate-100 dark:text-white text-slate-900 font-semibold text-sm dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={onNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
          {form.selectedTimeSlot ? 'Next' : 'Skip'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 – Consent / Terms
// ---------------------------------------------------------------------------

function Step4Consent({
  termsUrl,
  privacyUrl,
  onNext,
  onBack,
}: {
  termsUrl: string | null
  privacyUrl: string | null
  onNext: () => void
  onBack: () => void
}) {
  const [form, setForm] = useAtom(bookAppointmentAtom)
  const [certify, setCertify] = useState(form.certify ?? false)
  const [agreeTerms, setAgreeTerms] = useState(form.agreeTerms ?? false)
  const [agreePrivacy, setAgreePrivacy] = useState(form.agreePrivacy ?? false)

  const canProceed = certify && agreeTerms && agreePrivacy

  const handleNext = () => {
    setForm((p) => ({ ...p, certify, agreeTerms, agreePrivacy }))
    onNext()
  }

  const resolvedTermsUrl = termsUrl ?? DEFAULT_TERMS_URL
  const resolvedPrivacyUrl = privacyUrl ?? DEFAULT_PRIVACY_URL

  const consents: Array<{
    id: string
    checked: boolean
    onChange: (v: boolean) => void
    label: string
    description: string
    linkText: string | null
    linkHref: string | null
  }> = [
    {
      id: 'certify',
      checked: certify,
      onChange: setCertify,
      label: 'Certify that all information is accurate',
      description: 'I hereby certify that all information provided is true and accurate to the best of my knowledge.',
      linkText: null,
      linkHref: null,
    },
    {
      id: 'agreeTerms',
      checked: agreeTerms,
      onChange: setAgreeTerms,
      label: 'Terms and Conditions',
      description: 'I agree to the Terms and Conditions for Healthcare Providers and Healthcare Organizations.',
      linkText: 'Terms and Conditions',
      linkHref: resolvedTermsUrl,
    },
    {
      id: 'agreePrivacy',
      checked: agreePrivacy,
      onChange: setAgreePrivacy,
      label: 'Privacy Policy',
      description: 'I agree to the Privacy Policy for Healthcare Providers and Healthcare Organizations.',
      linkText: 'Privacy Policy',
      linkHref: resolvedPrivacyUrl,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Terms & Consent</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">Please review and accept the following to continue.</p>
      </div>

      <div className="flex flex-col gap-3">
        {consents.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => c.onChange(!c.checked)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              c.checked
                ? 'border-blue-500 dark:bg-blue-950/20 bg-blue-50'
                : 'dark:border-white/10 border-slate-200 dark:bg-slate-800/40 bg-white/40'
            }`}
          >
            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${c.checked ? 'bg-blue-600 border-blue-600' : 'dark:border-slate-500 border-slate-300'}`}>
              {c.checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold dark:text-white text-slate-900 text-sm">{c.label}</p>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">{c.description}</p>
              {c.linkHref && c.linkText && (
                <Link
                  href={c.linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  Read {c.linkText} →
                </Link>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-slate-700/60 bg-slate-100 dark:text-white text-slate-900 font-semibold text-sm dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 – Review & Submit
// ---------------------------------------------------------------------------

function Step5Review({
  clinicName,
  onBack,
  onSuccess,
}: {
  clinicName: string
  onBack: () => void
  onSuccess: () => void
}) {
  const [form] = useAtom(bookAppointmentAtom)
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: appointmentModes } = useClinicAppointmentModes(form.clinicUid ?? '')
  const { data: appointmentTypes } = useClinicAppointmentTypes(form.clinicUid ?? '')
  const { data: serviceCategories } = useClinicServiceCategories(form.clinicUid ?? '')
  const { data: hps } = useHPs({ clinicUid: form.clinicUid ?? '' })

  const [playSuccess] = useSound('/audio/success-1.mp3')

  const modeName = appointmentModes?.find((m) => m.id === form.modeId)?.name ?? '—'
  const typeName = appointmentTypes?.find((t) => t.id === form.appointmentTypeId)?.name ?? '—'
  const services = serviceCategories?.flatMap((c) => c.Services ?? []) ?? []
  const serviceName = services.find((s) => s.id === form.serviceId)?.name ?? '—'

  const hp = hps?.find((h) => h.id === form.hpId)
  const hpName = hp
    ? [hp.HPProfile?.title, hp.HPProfile?.name || `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(), hp.HPProfile?.suffix]
        .filter(Boolean)
        .join(' ')
    : 'No preference'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.clinicUid || !form.modeId || !form.appointmentTypeId || !form.serviceId || !form.subject) {
      toast.error('Please complete all required fields before submitting.')
      return
    }
    const requesterId = user?.id
    if (!requesterId) {
      toast.error('Unable to identify your account. Please sign in again.')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload attachments
      const attachmentUrls: string[] = []
      for (const file of form.attachments ?? []) {
        if (file.size > 4 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 4 MB)`)
          setIsSubmitting(false)
          return
        }
        const fd = new FormData()
        fd.append('media', file)
        fd.append('directory', `${requesterId}/appointment/attachments`)
        const loadingToastId = toast.loading(`Uploading ${file.name}…`)
        try {
          const uploadResult = await uploadMediaAction(fd)
          attachmentUrls.push(uploadResult.url)
        } catch {
          toast.error(`Failed to upload ${file.name}. Please try again.`)
          setIsSubmitting(false)
          return
        } finally {
          toast.dismiss(loadingToastId)
        }
      }

      const result = await createAppointmentAction({
        clinicUid: form.clinicUid,
        subject: form.subject,
        complaint: form.chiefComplaint,
        modeId: form.modeId,
        typeId: form.appointmentTypeId,
        serviceId: form.serviceId,
        requesters: [requesterId],
        attachments: attachmentUrls,
        hpId: form.hpId,
        schedule: {
          timeStart: form.selectedTimeSlot?.start
            ? dayjs(form.selectedTimeSlot.start).format('HH:mm:ss')
            : undefined,
          timeEnd: form.selectedTimeSlot?.end
            ? dayjs(form.selectedTimeSlot.end).format('HH:mm:ss')
            : undefined,
          date: form.preferredDate ? dayjs(form.preferredDate).endOf('day').toDate() : undefined,
        },
      })

      if (result.status) {
        playSuccess()
        mutate(
          (key) => typeof key === 'string' && key.startsWith(`/api/clinics/${form.clinicUid}/appointments`),
          undefined,
          { revalidate: true }
        )
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to book appointment')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const detailRows = [
    { label: 'Clinic', value: clinicName },
    { label: 'Subject', value: form.subject ?? '—' },
    { label: 'Chief Complaint', value: form.chiefComplaint || 'Not provided' },
    { label: 'Appointment Type', value: modeName },
    { label: 'Consultation Type', value: typeName },
    { label: 'Service', value: serviceName },
    { label: 'Preferred Doctor', value: hpName },
    {
      label: 'Date',
      value: form.preferredDate ? dayjs(form.preferredDate).format('ddd, MMM D, YYYY') : 'Not specified',
    },
    {
      label: 'Time Slot',
      value:
        form.selectedTimeSlot
          ? `${dayjs(form.selectedTimeSlot.start).format('LT')} – ${dayjs(form.selectedTimeSlot.end).format('LT')}`
          : 'Not specified',
    },
    {
      label: 'Attachments',
      value: (() => {
        const count = form.attachments?.length ?? 0
        return count > 0 ? `${count} file${count > 1 ? 's' : ''}` : 'None'
      })(),
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Review Your Booking</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">
          Please confirm the details below before submitting your appointment request.
        </p>
      </div>

      <div className="dark:bg-slate-800/40 bg-white/60 rounded-xl dark:border-white/10 border-slate-200 border divide-y dark:divide-white/5 divide-slate-100">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-start px-4 py-3 gap-4">
            <span className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide shrink-0 w-36">{row.label}</span>
            <span className="text-sm dark:text-white text-slate-900 break-words min-w-0">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Consent summary */}
      <div className="flex items-center gap-2 dark:bg-green-900/20 bg-green-50 dark:border-green-700/30 border-green-200 border rounded-xl px-4 py-3">
        <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
        <p className="text-sm dark:text-green-300 text-green-700 font-medium">You have agreed to the Terms & Conditions and Privacy Policy.</p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-slate-700/60 bg-slate-100 dark:text-white text-slate-900 font-semibold text-sm dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Booking…
            </>
          ) : (
            <>
              Book Appointment
              <Calendar className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({ clinicName, onBookAnother }: { clinicName: string; onBookAnother: () => void }) {
  return (
    <div className="text-center py-12 px-4 space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">
          Appointment Requested! 🎉
        </h2>
        <p className="dark:text-slate-400 text-slate-600 text-sm max-w-md mx-auto">
          Your appointment request has been sent to <strong>{clinicName}</strong>. Please keep your notifications on — you will hear back once the clinic reviews your booking.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onBookAnother}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Book Another
        </button>
        <Link
          href="/v2/patient"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl dark:bg-slate-700/60 bg-slate-100 dark:text-white text-slate-900 font-semibold text-sm dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function BookAppointmentWizard({
  clinicUid,
  clinicName,
  termsUrl,
  privacyUrl,
}: BookAppointmentWizardProps) {
  const router = useRouter()
  const [, setForm] = useAtom(bookAppointmentAtom)
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)

  // Seed clinicUid into global atom once on mount
  useEffect(() => {
    setForm((prev) => ({ ...prev, clinicUid }))
  }, [clinicUid, setForm])

  const goNext = useCallback(() => setCurrentStep((s) => Math.min(s + 1, 5)), [])
  const goBack = useCallback(() => {
    if (currentStep === 1) {
      router.push('/v2/patient')
    } else {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep, router])

  const handleSuccess = useCallback(() => {
    setIsComplete(true)
  }, [])

  const handleBookAnother = useCallback(() => {
    setForm({ clinicUid })
    setCurrentStep(1)
    setIsComplete(false)
  }, [clinicUid, setForm])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/v2/patient')}
            className="p-2 rounded-lg dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-700/50 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white text-slate-900">Book an Appointment</h1>
            <p className="text-sm dark:text-slate-400 text-slate-600">{clinicName}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Step indicator */}
      {!isComplete && (
        <div className="flex items-center mb-8">
          {STEPS.map((step, i) => (
            <div key={step.id} className="contents">
              <StepIndicator
                step={step.id}
                label={step.label}
                state={currentStep > step.id ? 'done' : currentStep === step.id ? 'active' : 'pending'}
              />
              {i < STEPS.length - 1 && <StepConnector done={currentStep > step.id} />}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="dark:bg-slate-800/30 bg-white/40 backdrop-blur-xl rounded-2xl dark:border-white/10 border-slate-200/60 border shadow-lg dark:shadow-slate-900/30 p-6 md:p-8">
        {isComplete ? (
          <SuccessScreen clinicName={clinicName} onBookAnother={handleBookAnother} />
        ) : currentStep === 1 ? (
          <Step1Complaint clinicUid={clinicUid} onNext={goNext} />
        ) : currentStep === 2 ? (
          <Step2Provider clinicUid={clinicUid} onNext={goNext} onBack={goBack} />
        ) : currentStep === 3 ? (
          <Step3Schedule onNext={goNext} onBack={goBack} />
        ) : currentStep === 4 ? (
          <Step4Consent termsUrl={termsUrl} privacyUrl={privacyUrl} onNext={goNext} onBack={goBack} />
        ) : (
          <Step5Review clinicName={clinicName} onBack={goBack} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}
