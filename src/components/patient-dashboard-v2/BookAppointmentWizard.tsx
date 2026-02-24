'use client'

/**
 * BookAppointmentWizard – v2 patient dashboard
 * Mobile-first 5-step appointment booking flow.
 * Visually distinct from the v1 BookAppointmentSheet (which is a top-slide drawer).
 */

import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { mutate } from 'swr'
import useSound from 'use-sound'
import dayjs from '@/lib/day-utils'
import {
  bookAppointmentAtom,
  BOOKING_DRAFT_KEY,
  BOOKING_DRAFT_TTL_MS,
  type BookAppointmentForm,
  type PersistedDraft,
  type StorageEnvelope,
} from '@/state/book-appointment'
import { createAppointmentAction } from '@/actions/appointments/appointments.action'
import { uploadMediaAction } from '@/actions/blob.action'
import { useHPs } from '@/hooks/useHP'
import { useTimeSlots } from '@/hooks/useTimeSlots'
import { useClinicServiceCategories } from '@/hooks/useClinicServiceCategory'
import { useClinicAppointmentTypes } from '@/hooks/useOrgAppointmentType'
import { useClinicAppointmentModes } from '@/hooks/useOrgAppointmentMode'
import BookingCalendar from '@/components/patient-dashboard-v2/BookingCalendar'
import BookingTimeSlots from '@/components/patient-dashboard-v2/BookingTimeSlots'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from '@/components/extention/file-upload'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Paperclip,
  Stethoscope,
  FileCheck,
  X,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  UserRound,
  Clock,
  ShieldCheck,
  ClipboardList,
  Building2,
  TriangleAlert,
  ChevronLeft,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
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
  { id: 1, label: 'Complaint',  icon: MessageSquarePlus },
  { id: 2, label: 'Doctor',     icon: UserRound },
  { id: 3, label: 'Schedule',   icon: Clock },
  { id: 4, label: 'Consent',    icon: ShieldCheck },
  { id: 5, label: 'Review',     icon: ClipboardList },
] as const

// Teal/emerald accent — completely different from the v1 blue
const ACCENT = {
  bar:    'bg-teal-500',
  ring:   'ring-teal-500',
  text:   'text-teal-600 dark:text-teal-400',
  border: 'border-teal-500',
  bg:     'bg-teal-50 dark:bg-teal-950/30',
  pill:   'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  btn:    'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white',
  check:  'bg-teal-600 border-teal-600',
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

/** Full-width label above a form field */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

/** Mobile-height text input */
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-base ${props.className ?? ''}`}
    />
  )
}

/** Mobile-height textarea */
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none text-base ${props.className ?? ''}`}
    />
  )
}

/** Sticky bottom action bar — mobile-app navigation pattern */
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 px-4 pb-[env(safe-area-inset-bottom)] pt-3 pb-4">
      <div className="max-w-lg mx-auto flex gap-3">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress header
// ---------------------------------------------------------------------------

function ProgressHeader({
  step,
  total,
  label,
  clinicName,
  onBack,
}: {
  step: number
  total: number
  label: string
  clinicName: string
  onBack: () => void
}) {
  const pct = Math.round(((step - 1) / total) * 100)
  const StepIcon = STEPS[step - 1]?.icon

  return (
    <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pb-0">
      {/* Thin progress strip */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700/60 mb-3">
        <div
          className={`h-full ${ACCENT.bar} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 pb-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {StepIcon && (
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${ACCENT.pill}`}>
                <StepIcon className="w-3.5 h-3.5" />
              </span>
            )}
            <span className={`text-xs font-bold uppercase tracking-widest ${ACCENT.text}`}>
              Step {step} of {total} — {label}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            <Building2 className="inline w-3 h-3 mr-1 -mt-px" />
            {clinicName}
          </p>
        </div>

        <ThemeToggle />
      </div>
    </div>
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
  const [files, setFiles] = useState<File[]>(form.attachments ?? [])

  const { data: serviceCategories } = useClinicServiceCategories(clinicUid)
  const { data: appointmentTypes } = useClinicAppointmentTypes(clinicUid)
  const { data: appointmentModes } = useClinicAppointmentModes(clinicUid)

  const subject = form.subject ?? ''
  const complaint = form.chiefComplaint ?? ''

  const canProceed =
    subject.trim().length >= 3 &&
    !!form.modeId &&
    !!form.appointmentTypeId &&
    !!form.serviceId

  const handleNext = () => {
    setForm((p) => ({
      ...p,
      subject: subject.trim(),
      chiefComplaint: complaint.trim(),
      attachments: files,
    }))
    onNext()
  }

  const dropZoneConfig = { maxFiles: 5, maxSize: 1024 * 1024 * 4, multiple: true }

  return (
    <div className="space-y-5 pb-28">
      {/* Section heading */}
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          What brings you in?
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell us about your concern so the clinic can prepare for your visit.
        </p>
      </div>

      {/* Subject */}
      <div>
        <FieldLabel required>Subject</FieldLabel>
        <TextInput
          type="text"
          value={subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          placeholder="e.g. Persistent headache for 3 days"
        />
        {subject.trim().length > 0 && subject.trim().length < 3 && (
          <p className="mt-1.5 text-xs text-red-500">Subject must be at least 3 characters.</p>
        )}
      </div>

      {/* Chief Complaint */}
      <div>
        <FieldLabel>Chief Complaint / Message</FieldLabel>
        <TextArea
          rows={4}
          value={complaint}
          onChange={(e) => setForm((p) => ({ ...p, chiefComplaint: e.target.value }))}
          placeholder="Describe your symptoms, when they started, what makes them better or worse…"
        />
      </div>

      {/* Service / Mode / Type — stacked for mobile */}
      <div className="space-y-4">
        <div>
          <FieldLabel required>Appointment Type</FieldLabel>
          <Select
            value={form.modeId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, modeId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="h-12 rounded-2xl bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-base">
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
          <FieldLabel required>Consultation Type</FieldLabel>
          <Select
            value={form.appointmentTypeId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, appointmentTypeId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="h-12 rounded-2xl bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-base">
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
          <FieldLabel required>Service</FieldLabel>
          <Select
            value={form.serviceId?.toString()}
            onValueChange={(v) => setForm((p) => ({ ...p, serviceId: parseInt(v, 10) }))}
          >
            <SelectTrigger className="h-12 rounded-2xl bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-base">
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
        <FieldLabel>
          Attachments{' '}
          <span className="font-normal text-slate-400 dark:text-slate-500">(optional · max 4 MB each)</span>
        </FieldLabel>
        <FileUploader
          value={files}
          onValueChange={(f) => setFiles(f ?? [])}
          dropzoneOptions={dropZoneConfig}
          className="relative bg-white/70 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl"
        >
          <FileInput className="outline-none rounded-2xl">
            <div className="flex flex-col items-center justify-center py-7 gap-2 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <Paperclip className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Tap to upload</span> or drag & drop
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG, GIF or PDF (max 4 MB)</p>
            </div>
          </FileInput>
          <FileUploaderContent className="px-3 pb-3">
            {files.map((file, i) => (
              <FileUploaderItem key={i} index={i} className="rounded-xl">
                <Paperclip className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="text-sm truncate">{file.name}</span>
              </FileUploaderItem>
            ))}
          </FileUploaderContent>
        </FileUploader>
      </div>

      <BottomBar>
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${ACCENT.btn}`}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </BottomBar>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 – Healthcare Provider
// ---------------------------------------------------------------------------

function Step2Provider({
  clinicUid,
  onNext,
}: {
  clinicUid: string
  onNext: () => void
}) {
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
    [
      hp.HPProfile?.title,
      hp.HPProfile?.name || `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
      hp.HPProfile?.suffix,
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className="space-y-4 pb-28">
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Choose Your Doctor
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select a preferred provider, or skip to let the clinic assign one.
        </p>
      </div>

      {hps === undefined ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading providers…</span>
        </div>
      ) : hps.length === 0 ? (
        <div className="rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 p-6 text-center">
          <Stethoscope className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No providers available right now.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">The clinic will assign a doctor when they confirm your booking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* No preference */}
          <ProviderCard
            label="No preference"
            sublabel="Let the clinic assign a doctor"
            isSelected={!form.hpId}
            onSelect={() => setForm((p) => ({ ...p, hpId: undefined, hpUserId: undefined }))}
            icon={<Stethoscope className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            iconBg="bg-slate-100 dark:bg-slate-700/60"
          />

          {groupedHps.map((group) => (
            <div key={group.hpTypeName}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1 mt-4">
                {group.hpTypeName}
              </p>
              {group.hps.map((hp) => (
                <ProviderCard
                  key={hp.id}
                  label={getHpLabel(hp)}
                  sublabel={group.hpTypeName}
                  isSelected={form.hpId === hp.id}
                  onSelect={() => setForm((p) => ({ ...p, hpId: hp.id, hpUserId: hp.User?.userId }))}
                  icon={<Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
                  iconBg="bg-teal-50 dark:bg-teal-900/20"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <BottomBar>
        <button
          type="button"
          onClick={onNext}
          className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${ACCENT.btn}`}
        >
          {form.hpId ? 'Continue' : 'Skip'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </BottomBar>
    </div>
  )
}

function ProviderCard({
  label,
  sublabel,
  isSelected,
  onSelect,
  icon,
  iconBg,
}: {
  label: string
  sublabel: string
  isSelected: boolean
  onSelect: () => void
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select ${label}, ${sublabel}`}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] mb-2 last:mb-0 ${
        isSelected
          ? `${ACCENT.border} ${ACCENT.bg}`
          : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/40 hover:border-teal-300 dark:hover:border-teal-700'
      }`}
    >
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</p>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? ACCENT.check : 'border-slate-300 dark:border-slate-600'}`}>
        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Step 3 – Schedule
// ---------------------------------------------------------------------------

function Step3Schedule({ onNext }: { onNext: () => void }) {
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
      isValidating
        ? []
        : (timeSlots?.data?.filter((a) => a.status).map((a) => dayjs(a.date).startOf('day').toDate()) ?? []),
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
    <div className="space-y-5 pb-28">
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Pick a Schedule
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose a date and time, or skip to let the clinic decide.
        </p>
      </div>

      {noHpSelected ? (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No doctor selected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Go back and select a doctor to view their available slots, or skip this step.
            </p>
          </div>
        </div>
      ) : isValidating ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
          <span className="text-sm">Loading available slots…</span>
        </div>
      ) : (
        /* Mobile-first calendar stacked above time slot grid */
        <div className="flex flex-col gap-5">
          <BookingCalendar
            availableDates={availableDates}
            preferredDate={form.preferredDate}
            onSelect={(date) =>
              setForm((p) => ({ ...p, preferredDate: date, selectedTimeSlot: undefined }))
            }
          />
          <BookingTimeSlots
            timeSlots={availableTimeSlots}
            selectedTimeSlot={form.selectedTimeSlot}
            preferredDate={form.preferredDate}
            onSelect={(ts) => setForm((p) => ({ ...p, selectedTimeSlot: ts }))}
          />
        </div>
      )}

      {form.selectedTimeSlot && (
        <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-2xl px-4 py-3">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <p className="text-sm text-teal-800 dark:text-teal-200 font-medium flex-1 min-w-0 truncate">
            {form.preferredDate && dayjs(form.preferredDate).format('ddd, MMM D, YYYY')}
            {' · '}
            {dayjs(form.selectedTimeSlot.start).format('LT')}–{dayjs(form.selectedTimeSlot.end).format('LT')}
          </p>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, selectedTimeSlot: undefined, preferredDate: undefined }))}
            className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <BottomBar>
        <button
          type="button"
          onClick={onNext}
          className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${ACCENT.btn}`}
        >
          {form.selectedTimeSlot ? 'Continue' : 'Skip'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </BottomBar>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 – Consent
// ---------------------------------------------------------------------------

function Step4Consent({
  termsUrl,
  privacyUrl,
  onNext,
}: {
  termsUrl: string | null
  privacyUrl: string | null
  onNext: () => void
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
      label: 'I certify this information is accurate',
      description:
        'All information provided is true and accurate to the best of my knowledge.',
      linkText: null,
      linkHref: null,
    },
    {
      id: 'agreeTerms',
      checked: agreeTerms,
      onChange: setAgreeTerms,
      label: 'Terms and Conditions',
      description: 'I agree to the Terms and Conditions for Healthcare Providers and Organizations.',
      linkText: 'Terms and Conditions',
      linkHref: resolvedTermsUrl,
    },
    {
      id: 'agreePrivacy',
      checked: agreePrivacy,
      onChange: setAgreePrivacy,
      label: 'Privacy Policy',
      description: 'I agree to the Privacy Policy for Healthcare Providers and Organizations.',
      linkText: 'Privacy Policy',
      linkHref: resolvedPrivacyUrl,
    },
  ]

  return (
    <div className="space-y-4 pb-28">
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Your Consent
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Please review and accept all items below to proceed.
        </p>
      </div>

      <div className="space-y-3">
        {consents.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => c.onChange(!c.checked)}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
              c.checked
                ? `${ACCENT.border} ${ACCENT.bg}`
                : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/40'
            }`}
          >
            <div
              className={`w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                c.checked ? ACCENT.check : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {c.checked && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
                {c.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {c.description}
              </p>
              {c.linkHref && c.linkText && (
                <Link
                  href={c.linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-block mt-2 text-xs font-semibold ${ACCENT.text} hover:underline`}
                >
                  Read {c.linkText} ↗
                </Link>
              )}
            </div>
          </button>
        ))}
      </div>

      <BottomBar>
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${ACCENT.btn}`}
        >
          Review Booking
          <ArrowRight className="w-5 h-5" />
        </button>
      </BottomBar>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 – Review & Submit
// ---------------------------------------------------------------------------

function Step5Review({
  clinicName,
  onSuccess,
}: {
  clinicName: string
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
    ? [
        hp.HPProfile?.title,
        hp.HPProfile?.name || `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
        hp.HPProfile?.suffix,
      ]
        .filter(Boolean)
        .join(' ')
    : 'No preference'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const {
      clinicUid,
      modeId,
      appointmentTypeId,
      serviceId,
      subject,
      chiefComplaint,
      hpId,
      selectedTimeSlot,
      preferredDate,
      attachments,
    } = form

    if (!clinicUid || !modeId || !appointmentTypeId || !serviceId || !subject) {
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
      const attachmentUrls: string[] = []
      for (const file of attachments ?? []) {
        if (file.size > 4 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 4 MB limit.`)
          setIsSubmitting(false)
          return
        }
        const fd = new FormData()
        fd.append('media', file)
        fd.append('directory', `${requesterId}/appointment/attachments`)
        const loadingId = toast.loading(`Uploading ${file.name}…`)
        try {
          const result = await uploadMediaAction(fd)
          attachmentUrls.push(result.url)
        } catch {
          toast.error(`Failed to upload ${file.name}. Please try again.`)
          setIsSubmitting(false)
          return
        } finally {
          toast.dismiss(loadingId)
        }
      }

      const result = await createAppointmentAction({
        clinicUid,
        subject,
        complaint: chiefComplaint,
        modeId,
        typeId: appointmentTypeId,
        serviceId,
        requesters: [requesterId],
        attachments: attachmentUrls,
        hpId,
        schedule: {
          timeStart: selectedTimeSlot?.start
            ? dayjs(selectedTimeSlot.start).format('HH:mm:ss')
            : undefined,
          timeEnd: selectedTimeSlot?.end
            ? dayjs(selectedTimeSlot.end).format('HH:mm:ss')
            : undefined,
          date: preferredDate ? dayjs(preferredDate).endOf('day').toDate() : undefined,
        },
      })

      if (result.status) {
        playSuccess()
        mutate(
          (key) =>
            typeof key === 'string' &&
            key.startsWith(`/api/clinics/${clinicUid}/appointments`),
          undefined,
          { revalidate: true }
        )
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to book appointment.')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const summaryRows = [
    { label: 'Clinic', value: clinicName },
    { label: 'Subject', value: form.subject ?? '—' },
    { label: 'Complaint', value: form.chiefComplaint || 'Not provided' },
    { label: 'Appt. Type', value: modeName },
    { label: 'Consult. Type', value: typeName },
    { label: 'Service', value: serviceName },
    { label: 'Doctor', value: hpName },
    {
      label: 'Date',
      value: form.preferredDate
        ? dayjs(form.preferredDate).format('ddd, MMM D, YYYY')
        : 'Not specified',
    },
    {
      label: 'Time',
      value: form.selectedTimeSlot
        ? `${dayjs(form.selectedTimeSlot.start).format('LT')} – ${dayjs(form.selectedTimeSlot.end).format('LT')}`
        : 'Not specified',
    },
    {
      label: 'Attachments',
      value: (() => {
        const n = form.attachments?.length ?? 0
        return n > 0 ? `${n} file${n > 1 ? 's' : ''}` : 'None'
      })(),
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-28">
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Review Your Booking
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Confirm these details before submitting your request.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 bg-white/70 dark:bg-slate-800/50">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex items-start px-4 py-3 gap-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0 w-24 pt-0.5">
              {row.label}
            </span>
            <span className="text-sm text-slate-900 dark:text-white break-words min-w-0 flex-1">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Consent badge */}
      <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-2xl px-4 py-3">
        <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
        <p className="text-sm text-teal-800 dark:text-teal-200 font-medium">
          You have agreed to the Terms & Conditions and Privacy Policy.
        </p>
      </div>

      <BottomBar>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${ACCENT.btn}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Confirm Booking
              <Calendar className="w-5 h-5" />
            </>
          )}
        </button>
      </BottomBar>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({
  clinicName,
  onBookAnother,
}: {
  clinicName: string
  onBookAnother: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4 gap-6">
      {/* Animated check mark */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-14 h-14 text-teal-500 dark:text-teal-400" />
        </div>
        {/* Ripple rings */}
        <span className="absolute inset-0 rounded-full border-4 border-teal-400/40 animate-ping" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Booking Sent! 🎉
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Your request has been sent to <strong className="text-slate-700 dark:text-slate-200">{clinicName}</strong>. Keep notifications on — the clinic will confirm your appointment soon.
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3 mt-2">
        <button
          type="button"
          onClick={onBookAnother}
          className={`w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base ${ACCENT.btn}`}
        >
          Book Another
        </button>
        <Link
          href="/v2/patient"
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Wizard shell
// ---------------------------------------------------------------------------

/** Write the serialisable form fields to localStorage with a fresh 30-min TTL. */
function saveDraft(form: BookAppointmentForm) {
  try {
    const draft: PersistedDraft = {
      clinicUid: form.clinicUid,
      appointmentTypeId: form.appointmentTypeId,
      serviceId: form.serviceId,
      hpId: form.hpId,
      hpUserId: form.hpUserId,
      modeId: form.modeId,
      preferredDate: form.preferredDate?.toISOString(),
      selectedTimeSlot: form.selectedTimeSlot
        ? {
            start: form.selectedTimeSlot.start.toISOString(),
            end: form.selectedTimeSlot.end.toISOString(),
          }
        : undefined,
      subject: form.subject,
      chiefComplaint: form.chiefComplaint,
      certify: form.certify,
      agreeTerms: form.agreeTerms,
      agreePrivacy: form.agreePrivacy,
    }
    const envelope: StorageEnvelope = { expiresAt: Date.now() + BOOKING_DRAFT_TTL_MS, draft }
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(envelope))
  } catch {
    // localStorage may be unavailable (private mode, storage quota exceeded)
  }
}

/** Remove the draft from localStorage. */
function clearDraftFromStorage() {
  try {
    localStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {
    // ignore
  }
}

export default function BookAppointmentWizard({
  clinicUid,
  clinicName,
  termsUrl,
  privacyUrl,
}: BookAppointmentWizardProps) {
  const router = useRouter()
  const [form, setForm] = useAtom(bookAppointmentAtom)
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)

  // On mount: hydrate form from localStorage draft (if not expired), then
  // set clinicUid. Any expired envelope is wiped immediately.
  useEffect(() => {
    const raw = localStorage.getItem(BOOKING_DRAFT_KEY)
    if (raw) {
      try {
        const envelope = JSON.parse(raw) as StorageEnvelope
        if (!envelope.expiresAt || Date.now() > envelope.expiresAt) {
          clearDraftFromStorage()
        } else {
          const d = envelope.draft
          setForm({
            clinicUid,
            appointmentTypeId: d.appointmentTypeId,
            serviceId: d.serviceId,
            hpId: d.hpId,
            hpUserId: d.hpUserId,
            modeId: d.modeId,
            preferredDate: d.preferredDate ? new Date(d.preferredDate) : undefined,
            selectedTimeSlot: d.selectedTimeSlot
              ? {
                  start: new Date(d.selectedTimeSlot.start),
                  end: new Date(d.selectedTimeSlot.end),
                }
              : undefined,
            subject: d.subject,
            chiefComplaint: d.chiefComplaint,
            certify: d.certify,
            agreeTerms: d.agreeTerms,
            agreePrivacy: d.agreePrivacy,
          })
          return
        }
      } catch {
        clearDraftFromStorage()
      }
    }
    setForm((prev) => ({ ...prev, clinicUid }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist form to localStorage whenever it changes (skip initial empty state)
  useEffect(() => {
    if (form.subject || form.modeId || form.appointmentTypeId) {
      saveDraft(form)
    }
  }, [form])

  const goNext = useCallback(() => setCurrentStep((s) => Math.min(s + 1, 5)), [])

  const goBack = useCallback(() => {
    if (currentStep === 1) {
      router.push('/v2/patient')
    } else {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep, router])

  const handleSuccess = useCallback(() => {
    clearDraftFromStorage()
    setIsComplete(true)
  }, [])

  const handleBookAnother = useCallback(() => {
    clearDraftFromStorage()
    setForm({ clinicUid })
    setCurrentStep(1)
    setIsComplete(false)
  }, [clinicUid, setForm])

  const currentStepMeta = STEPS[currentStep - 1]

  return (
    /* Break out of parent horizontal padding on mobile for full-bleed header */
    <div className="-mx-4 sm:-mx-0">
      {!isComplete && (
        <ProgressHeader
          step={currentStep}
          total={STEPS.length}
          label={currentStepMeta?.label ?? ''}
          clinicName={clinicName}
          onBack={goBack}
        />
      )}

      <div className="px-4 sm:px-0 max-w-lg mx-auto">
        {isComplete ? (
          <SuccessScreen clinicName={clinicName} onBookAnother={handleBookAnother} />
        ) : currentStep === 1 ? (
          <Step1Complaint clinicUid={clinicUid} onNext={goNext} />
        ) : currentStep === 2 ? (
          <Step2Provider clinicUid={clinicUid} onNext={goNext} />
        ) : currentStep === 3 ? (
          <Step3Schedule onNext={goNext} />
        ) : currentStep === 4 ? (
          <Step4Consent termsUrl={termsUrl} privacyUrl={privacyUrl} onNext={goNext} />
        ) : (
          <Step5Review clinicName={clinicName} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}
