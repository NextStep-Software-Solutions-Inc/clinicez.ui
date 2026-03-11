'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Stethoscope,
  Clock,
  CheckCircle2,
  Archive,
  ChevronLeft,
  FileText,
  Pill,
  TestTube,
  Scan,
  FileCheck,
  ClipboardList,
  ArrowLeft,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Mail,
  CalendarCheck,
  ActivitySquare,
  Download,
} from 'lucide-react'
import type { GetPatientSelfHistory } from '@/actions/patient-dashboard/get-self-history'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import DownloadPrescriptionAction from '@/components/clinic/clinical-records/prescription/DownloadPrescriptionAction'
import DownloadMedicalCertificateAction from '@/components/medical-certificate/DownloadMedicalCertificateAction'
import DownloadLaboratoryRequestAction from '@/components/laboratory-requests/DownloadLaboratoryRequestAction'
import DownloadImagingStudiesAction from '@/components/imaging-studies/DownloadImagingStudiesAction'
import DownloadHeartStationRequestAction from '@/components/heart-station-requests/DownloadHeartStationRequestAction'
import DownloadReferralSlipAction from '@/components/referral-slip/DownloadReferralSlipAction'

type HistoryData = NonNullable<GetPatientSelfHistory['data']>
type Appointment = HistoryData['appointments'][number]
type ConsultationTicket = HistoryData['consultationTickets'][number]

type TabFilter = 'all' | 'appointments' | 'consultations'

interface PatientHistoryClientProps {
  patientName: string
  appointments: HistoryData['appointments']
  consultationTickets: HistoryData['consultationTickets']
}

// ---------------------------------------------------------------------------
// Status config — single source of truth for colors, labels, and icons
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string
  /** Tailwind classes for the badge pill */
  badge: string
  /** Tailwind classes for the left selection accent strip */
  accent: string
  /** Tailwind classes for the selected row highlight */
  selectedBg: string
  Icon: React.ElementType
}

function getAppointmentStatusConfig(status?: string | null): StatusConfig {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending',
        badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30',
        accent: 'border-l-amber-400',
        selectedBg: 'dark:bg-amber-500/10 bg-amber-50/60',
        Icon: AlertCircle,
      }
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/30',
        accent: 'border-l-sky-400',
        selectedBg: 'dark:bg-sky-500/10 bg-sky-50/60',
        Icon: CalendarCheck,
      }
    case 'RECEIVED':
      return {
        label: 'Received',
        badge: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-400/30',
        accent: 'border-l-teal-400',
        selectedBg: 'dark:bg-teal-500/10 bg-teal-50/60',
        Icon: Mail,
      }
    case 'ROUTED':
      return {
        label: 'Routed',
        badge: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-400/30',
        accent: 'border-l-violet-400',
        selectedBg: 'dark:bg-violet-500/10 bg-violet-50/60',
        Icon: Send,
      }
    case 'COMPLETED':
      return {
        label: 'Completed',
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
        accent: 'border-l-emerald-400',
        selectedBg: 'dark:bg-emerald-500/10 bg-emerald-50/60',
        Icon: CheckCircle2,
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30',
        accent: 'border-l-rose-400',
        selectedBg: 'dark:bg-rose-500/10 bg-rose-50/60',
        Icon: XCircle,
      }
    case 'DECLINED':
      return {
        label: 'Declined',
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30',
        accent: 'border-l-rose-400',
        selectedBg: 'dark:bg-rose-500/10 bg-rose-50/60',
        Icon: XCircle,
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30',
        accent: 'border-l-rose-400',
        selectedBg: 'dark:bg-rose-500/10 bg-rose-50/60',
        Icon: XCircle,
      }
    case 'RESCHEDULED':
      return {
        label: 'Rescheduled',
        badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/30',
        accent: 'border-l-purple-400',
        selectedBg: 'dark:bg-purple-500/10 bg-purple-50/60',
        Icon: RefreshCw,
      }
    case 'NO_SHOW':
      return {
        label: 'No Show',
        badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/30',
        accent: 'border-l-orange-400',
        selectedBg: 'dark:bg-orange-500/10 bg-orange-50/60',
        Icon: AlertCircle,
      }
    default:
      return {
        label: status ?? 'Unknown',
        badge: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-400/30',
        accent: 'border-l-slate-400',
        selectedBg: 'dark:bg-slate-500/10 bg-slate-50/60',
        Icon: Calendar,
      }
  }
}

function getConsultationStatusConfig(status?: string | null, isArchived?: boolean): StatusConfig {
  if (isArchived) {
    return {
      label: 'Archived',
      badge: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-400/30',
      accent: 'border-l-slate-400',
      selectedBg: 'dark:bg-slate-500/10 bg-slate-50/60',
      Icon: Archive,
    }
  }
  switch (status) {
    case 'PROCESSING':
      return {
        label: 'In Progress',
        badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/30',
        accent: 'border-l-sky-400',
        selectedBg: 'dark:bg-sky-500/10 bg-sky-50/60',
        Icon: ActivitySquare,
      }
    case 'RESOLVED':
      return {
        label: 'Resolved',
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
        accent: 'border-l-emerald-400',
        selectedBg: 'dark:bg-emerald-500/10 bg-emerald-50/60',
        Icon: CheckCircle2,
      }
    case 'UNRESOLVED':
      return {
        label: 'Unresolved',
        badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30',
        accent: 'border-l-rose-400',
        selectedBg: 'dark:bg-rose-500/10 bg-rose-50/60',
        Icon: AlertCircle,
      }
    default:
      return {
        label: status ?? 'Open',
        badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30',
        accent: 'border-l-amber-400',
        selectedBg: 'dark:bg-amber-500/10 bg-amber-50/60',
        Icon: Clock,
      }
  }
}

// ---------------------------------------------------------------------------
// Unified list item
// ---------------------------------------------------------------------------

type ListItem =
  | { kind: 'consultation'; data: ConsultationTicket; date: Date }
  | { kind: 'appointment'; data: Appointment; date: Date }

/**
 * Returns the most meaningful date to display/sort for a consultation:
 * 1. Linked appointment date  (the actual day the patient came in)
 * 2. Ticket creation date     (fallback when no appointment is linked, or
 *                              the appointment has no AppointmentAttribute yet)
 */
function getConsultationDisplayDate(ticket: ConsultationTicket): Date {
  return ticket.Appointment?.AppointmentAttribute?.date
    ? new Date(ticket.Appointment.AppointmentAttribute.date)
    : new Date(ticket.createdAt)
}

/** Separator used between start and end times in a time range display */
const TIME_RANGE_SEPARATOR = ' \u2013 ' // en dash

/** Formats a "HH:MM" time string into "h:mm AM/PM". Returns null for falsy or unparseable input. */
function formatTime(t: string | null | undefined): string | null {
  if (!t) return null
  const parts = t.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Returns a formatted " · start – end" time range string, or null when no time is available.
 * Suitable for appending directly after a date string.
 */
function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string | null {
  const ts = formatTime(start)
  if (!ts) return null
  const te = formatTime(end)
  return te ? ` · ${ts}${TIME_RANGE_SEPARATOR}${te}` : ` · ${ts}`
}

// ---------------------------------------------------------------------------
// Detail panels
// ---------------------------------------------------------------------------

function StatusBadge({ config }: { config: StatusConfig }) {
  const { Icon, label, badge } = config
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function ConsultationDetailPanel({ ticket, onBack }: { ticket: ConsultationTicket; onBack: () => void }) {
  // Merge ConsultationTicketHPs (explicit assignment) with the linked
  // appointment's AppointmentRouting HP (accepted/pending assignment).
  // This ensures the doctor who accepted the appointment routing is always
  // shown even when the consultation ticket wasn't created with hpIds.
  const consultationHPs = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider)
  // [0] is safe here: the query orders by status asc then createdAt desc,
  // which places the single ACCEPTED entry (alphabetically before PENDING)
  // first. With take:1, the array always has at most one element.
  const routingHP = ticket.Appointment?.AppointmentRouting?.[0]?.RoutedTo
  const hpById = new Map(consultationHPs.map((h) => [h.id, h]))
  if (routingHP && !hpById.has(routingHP.id)) {
    hpById.set(routingHP.id, routingHP)
  }
  const hps = Array.from(hpById.values())
  const appointment = ticket.Appointment
  const statusConfig = getConsultationStatusConfig(
    ticket.ConsultationTicketAttribute?.status,
    ticket.isArchived
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail header */}
      <div className="px-5 pt-5 pb-4 shrink-0 dark:border-b dark:border-white/10 border-b border-slate-200/60">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-1 text-xs dark:text-slate-400 text-slate-500 mb-3 dark:hover:text-white hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All Records
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <StatusBadge config={statusConfig} />
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
                <Stethoscope className="h-3 w-3" />
                Consultation
              </span>
            </div>
            <h2 className="text-lg font-bold dark:text-white text-slate-900 leading-snug">
              {ticket.subject ?? 'Consultation'}
            </h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {ticket.Clinic && (
                <span className="text-sm dark:text-slate-400 text-slate-500">{ticket.Clinic.name}</span>
              )}
              {ticket.caseNumber && (
                <span className="text-xs dark:text-slate-500 text-slate-400 font-mono">
                  #{ticket.caseNumber}
                </span>
              )}
              <span className="text-xs dark:text-slate-500 text-slate-400">
                {getConsultationDisplayDate(ticket).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {formatTimeRange(
                  ticket.Appointment?.AppointmentAttribute?.timeStart,
                  ticket.Appointment?.AppointmentAttribute?.timeEnd
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Healthcare Providers */}
        {hps.length > 0 && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Your Healthcare Providers
            </p>
            <div className="flex flex-col gap-2">
              {hps.map((hp) => (
                <div
                  key={hp.id}
                  className="flex items-center gap-3 dark:bg-slate-800/40 bg-slate-100/60 rounded-xl px-3.5 py-2.5"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4.5 w-4.5 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-white text-slate-900 truncate">
                      {[
                        hp.HPProfile?.title,
                        hp.HPProfile?.name ||
                          `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
                        hp.HPProfile?.suffix,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                    {hp.HPType?.name && (
                      <p className="text-xs dark:text-slate-400 text-slate-500">{hp.HPType.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Linked Appointment */}
        {appointment && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Linked Appointment
            </p>
            <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-3.5">
              <p className="text-sm font-medium dark:text-white text-slate-900 mb-2">
                {appointment.subject ?? appointment.complaint ?? 'Appointment'}
              </p>
              {appointment.AppointmentAttribute && (
                <div className="flex flex-wrap gap-1.5">
                  {appointment.AppointmentAttribute.date && (
                    <span className="inline-flex items-center gap-1 text-xs dark:text-slate-400 text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(appointment.AppointmentAttribute.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {appointment.AppointmentAttribute.AppointmentType?.name && (
                    <span className="text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
                      {appointment.AppointmentAttribute.AppointmentType.name}
                    </span>
                  )}
                  {appointment.AppointmentAttribute.Service?.name && (
                    <span className="text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
                      {appointment.AppointmentAttribute.Service.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Consultation Notes */}
        <section>
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
            Doctor&apos;s Notes
          </p>
          {ticket.ConsultationNotes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {ticket.ConsultationNotes.map((note) => (
                <div
                  key={note.id}
                  className="dark:bg-gradient-to-br dark:from-slate-900/60 dark:to-slate-800/40 bg-white/80 rounded-xl p-4 dark:border-white/10 border-slate-200/70 border shadow-sm"
                >
                  <p className="text-xs font-bold dark:text-violet-400 text-violet-600 uppercase tracking-widest mb-2">
                    {note.section}
                  </p>
                  <p className="text-sm dark:text-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="mt-3 pt-2.5 border-t dark:border-white/10 border-slate-200/60 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-xs dark:text-emerald-400 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Shared with you
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dark:bg-slate-800/30 bg-slate-100/60 rounded-xl p-8 text-center">
              <FileText className="h-9 w-9 mx-auto dark:text-slate-600 text-slate-400 mb-2.5" />
              <p className="text-sm dark:text-slate-400 text-slate-500">
                No notes have been shared with you yet.
              </p>
            </div>
          )}
        </section>

        {/* Downloadable Documents */}
        {(ticket.Prescriptions.length > 0 ||
          ticket.MedicalCertificates.length > 0 ||
          ticket.LaboratoryRequests.length > 0 ||
          ticket.ImagingRequests.length > 0 ||
          (ticket.HeartStationRequests?.length ?? 0) > 0 ||
          (ticket.ClinicReferralSlips?.length ?? 0) > 0) && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              From This Visit
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ticket.Prescriptions.map((rx) => (
                <DownloadPrescriptionAction key={rx.id} prescription={rx}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-emerald-500/10 bg-emerald-50 rounded-xl px-3 py-2.5 border dark:border-emerald-400/20 border-emerald-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <Pill className="h-4 w-4 dark:text-emerald-400 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-emerald-300 text-emerald-700">Prescription</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-emerald-400 text-emerald-600 shrink-0" />
                  </button>
                </DownloadPrescriptionAction>
              ))}
              {ticket.MedicalCertificates.map((cert) => (
                <DownloadMedicalCertificateAction key={cert.id} certificate={cert}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-sky-500/10 bg-sky-50 rounded-xl px-3 py-2.5 border dark:border-sky-400/20 border-sky-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <FileCheck className="h-4 w-4 dark:text-sky-400 text-sky-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-sky-300 text-sky-700">Certificate</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-sky-400 text-sky-600 shrink-0" />
                  </button>
                </DownloadMedicalCertificateAction>
              ))}
              {ticket.LaboratoryRequests.map((lab) => (
                <DownloadLaboratoryRequestAction key={lab.id} request={lab}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-purple-500/10 bg-purple-50 rounded-xl px-3 py-2.5 border dark:border-purple-400/20 border-purple-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <TestTube className="h-4 w-4 dark:text-purple-400 text-purple-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-purple-300 text-purple-700">Lab Request</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-purple-400 text-purple-600 shrink-0" />
                  </button>
                </DownloadLaboratoryRequestAction>
              ))}
              {ticket.ImagingRequests.map((img) => (
                <DownloadImagingStudiesAction key={img.id} study={img}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-orange-500/10 bg-orange-50 rounded-xl px-3 py-2.5 border dark:border-orange-400/20 border-orange-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <Scan className="h-4 w-4 dark:text-orange-400 text-orange-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-orange-300 text-orange-700">Imaging</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-orange-400 text-orange-600 shrink-0" />
                  </button>
                </DownloadImagingStudiesAction>
              ))}
              {(ticket.HeartStationRequests ?? []).map((hs) => (
                <DownloadHeartStationRequestAction key={hs.id} request={hs}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-rose-500/10 bg-rose-50 rounded-xl px-3 py-2.5 border dark:border-rose-400/20 border-rose-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <ClipboardList className="h-4 w-4 dark:text-rose-400 text-rose-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-rose-300 text-rose-700">Heart Station</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-rose-400 text-rose-600 shrink-0" />
                  </button>
                </DownloadHeartStationRequestAction>
              ))}
              {(ticket.ClinicReferralSlips ?? []).map((ref) => (
                <DownloadReferralSlipAction key={ref.id} referralSlip={ref}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 dark:bg-teal-500/10 bg-teal-50 rounded-xl px-3 py-2.5 border dark:border-teal-400/20 border-teal-200/60 hover:opacity-80 transition-opacity text-left"
                  >
                    <FileText className="h-4 w-4 dark:text-teal-400 text-teal-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-teal-300 text-teal-700">Referral</p>
                    </div>
                    <Download className="h-3 w-3 dark:text-teal-400 text-teal-600 shrink-0" />
                  </button>
                </DownloadReferralSlipAction>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function AppointmentDetailPanel({ appointment, onBack }: { appointment: Appointment; onBack: () => void }) {
  const attr = appointment.AppointmentAttribute
  const hp = appointment.AppointmentRouting[0]?.RoutedTo
  const statusConfig = getAppointmentStatusConfig(attr?.status)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail header */}
      <div className="px-5 pt-5 pb-4 shrink-0 dark:border-b dark:border-white/10 border-b border-slate-200/60">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-1 text-xs dark:text-slate-400 text-slate-500 mb-3 dark:hover:text-white hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All Records
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {attr && <StatusBadge config={statusConfig} />}
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
                <Calendar className="h-3 w-3" />
                Appointment
              </span>
            </div>
            <h2 className="text-lg font-bold dark:text-white text-slate-900 leading-snug">
              {appointment.subject ?? appointment.complaint ?? 'Appointment'}
            </h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {appointment.Clinic && (
                <span className="text-sm dark:text-slate-400 text-slate-500">{appointment.Clinic.name}</span>
              )}
              {attr?.date ? (
                <span className="inline-flex items-center gap-1 text-xs dark:text-slate-500 text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(attr.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {formatTimeRange(attr.timeStart, attr.timeEnd)}
                </span>
              ) : (
                <span className="text-xs dark:text-slate-500 text-slate-400">
                  {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Appointment Details */}
        {attr && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Appointment Details
            </p>
            <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl divide-y dark:divide-white/5 divide-slate-200/60 overflow-hidden">
              {attr.date && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar className="h-4 w-4 dark:text-sky-400 text-sky-500 shrink-0" />
                  <div>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mb-0.5">Date &amp; Time</p>
                    <p className="text-sm font-medium dark:text-white text-slate-900">
                      {new Date(attr.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {formatTimeRange(attr.timeStart, attr.timeEnd) && (
                        <span className="dark:text-slate-300 text-slate-600">
                          {formatTimeRange(attr.timeStart, attr.timeEnd)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {attr.AppointmentType?.name && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <ClipboardList className="h-4 w-4 dark:text-violet-400 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mb-0.5">Type</p>
                    <p className="text-sm font-medium dark:text-white text-slate-900">
                      {attr.AppointmentType.name}
                    </p>
                  </div>
                </div>
              )}
              {attr.AppointmentMode?.name && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <ActivitySquare className="h-4 w-4 dark:text-teal-400 text-teal-500 shrink-0" />
                  <div>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mb-0.5">Mode</p>
                    <p className="text-sm font-medium dark:text-white text-slate-900">
                      {attr.AppointmentMode.name}
                    </p>
                  </div>
                </div>
              )}
              {attr.Service?.name && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Stethoscope className="h-4 w-4 dark:text-emerald-400 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mb-0.5">Service</p>
                    <p className="text-sm font-medium dark:text-white text-slate-900">
                      {attr.Service.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Assigned Provider */}
        {hp && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Healthcare Provider
            </p>
            <div className="flex items-center gap-3 dark:bg-slate-800/40 bg-slate-100/60 rounded-xl px-3.5 py-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <Stethoscope className="h-4 w-4 text-violet-500" />
              </div>
              <p className="text-sm font-medium dark:text-white text-slate-900">
                {[
                  hp.HPProfile?.title,
                  hp.HPProfile?.name ||
                    `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
                  hp.HPProfile?.suffix,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            </div>
          </section>
        )}

        {/* Complaint */}
        {appointment.complaint && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Chief Complaint
            </p>
            <p className="text-sm dark:text-slate-200 text-slate-800 dark:bg-slate-800/40 bg-slate-100/60 rounded-xl px-4 py-3 leading-relaxed">
              {appointment.complaint}
            </p>
          </section>
        )}

        {/* No consultation recorded */}
        {appointment.ConsultationTickets.length === 0 && (
          <div className="dark:bg-slate-800/30 bg-slate-100/60 rounded-xl p-6 text-center">
            <Stethoscope className="h-9 w-9 mx-auto dark:text-slate-600 text-slate-400 mb-2.5" />
            <p className="text-sm dark:text-slate-400 text-slate-500">
              No consultation notes recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// List item row
// ---------------------------------------------------------------------------

function ListItemRow({
  item,
  isSelected,
  onSelect,
}: {
  item: ListItem
  isSelected: boolean
  onSelect: () => void
}) {
  if (item.kind === 'consultation') {
    const ticket = item.data as ConsultationTicket
    const cfg = getConsultationStatusConfig(
      ticket.ConsultationTicketAttribute?.status,
      ticket.isArchived
    )
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left border-b dark:border-white/5 border-slate-200/60 transition-colors dark:hover:bg-white/5 hover:bg-slate-50/60 border-l-[3px] ${
          isSelected ? `${cfg.selectedBg} ${cfg.accent}` : 'border-l-transparent'
        }`}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <cfg.Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.badge.split(' ').find(c => c.startsWith('text-')) ?? 'text-slate-400'}`} />
              <p className="text-sm font-semibold dark:text-white text-slate-900 line-clamp-1">
                {ticket.subject ?? 'Consultation'}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap ml-5">
            {ticket.Clinic && (
              <span className="text-xs dark:text-slate-500 text-slate-400">{ticket.Clinic.name}</span>
            )}
            {ticket.caseNumber && (
              <span className="text-xs dark:text-slate-500 text-slate-400 font-mono">#{ticket.caseNumber}</span>
            )}
            <span className="text-xs dark:text-slate-500 text-slate-400">
              {getConsultationDisplayDate(ticket).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {formatTimeRange(
                ticket.Appointment?.AppointmentAttribute?.timeStart,
                ticket.Appointment?.AppointmentAttribute?.timeEnd
              )}
            </span>
          </div>
          {(ticket.ConsultationNotes.length > 0 || ticket.Prescriptions.length > 0) && (
            <div className="flex items-center gap-2.5 mt-2 ml-5">
              {ticket.ConsultationNotes.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs dark:text-slate-500 text-slate-400">
                  <FileText className="h-3 w-3" />
                  {ticket.ConsultationNotes.length} note{ticket.ConsultationNotes.length !== 1 ? 's' : ''}
                </span>
              )}
              {ticket.Prescriptions.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs dark:text-emerald-400/70 text-emerald-600">
                  <Pill className="h-3 w-3" />
                  {ticket.Prescriptions.length} Rx
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    )
  }

  const appt = item.data as Appointment
  const cfg = getAppointmentStatusConfig(appt.AppointmentAttribute?.status)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border-b dark:border-white/5 border-slate-200/60 transition-colors dark:hover:bg-white/5 hover:bg-slate-50/60 border-l-[3px] ${
        isSelected ? `${cfg.selectedBg} ${cfg.accent}` : 'border-l-transparent'
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className={`h-3.5 w-3.5 shrink-0 dark:text-sky-400 text-sky-500`} />
            <p className="text-sm font-semibold dark:text-white text-slate-900 line-clamp-1">
              {appt.subject ?? appt.complaint ?? 'Appointment'}
            </p>
          </div>
          {appt.AppointmentAttribute?.status && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-5">
          {appt.Clinic && (
            <span className="text-xs dark:text-slate-500 text-slate-400">{appt.Clinic.name}</span>
          )}
          {appt.AppointmentAttribute?.date && (
            <span className="inline-flex items-center gap-1 text-xs dark:text-slate-500 text-slate-400">
              <Calendar className="h-3 w-3" />
              {new Date(appt.AppointmentAttribute.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {formatTimeRange(appt.AppointmentAttribute?.timeStart, appt.AppointmentAttribute?.timeEnd)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PatientHistoryClient({
  patientName,
  appointments,
  consultationTickets,
}: PatientHistoryClientProps) {
  const [tab, setTab] = useState<TabFilter>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const allItems = useMemo<ListItem[]>(() => [
    ...consultationTickets.map(
      (t): ListItem => ({
        kind: 'consultation',
        data: t,
        // Prefer the linked appointment's actual date for consistent sorting
        date: getConsultationDisplayDate(t),
      })
    ),
    // Include appointments that have no linked consultation yet
    ...appointments
      .filter((a) => a.ConsultationTickets.length === 0)
      .map(
        (a): ListItem => ({
          kind: 'appointment',
          data: a,
          date: a.AppointmentAttribute?.date
            ? new Date(a.AppointmentAttribute.date)
            : new Date(a.createdAt),
        })
      ),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()), [appointments, consultationTickets])

  const listItems = useMemo<ListItem[]>(() => {
    if (tab === 'appointments') return allItems.filter((i) => i.kind === 'appointment')
    if (tab === 'consultations') return allItems.filter((i) => i.kind === 'consultation')
    return allItems
  }, [allItems, tab])

  // Auto-select first when tab changes
  const effectiveKey = selectedKey ?? (listItems[0] ? `${listItems[0].kind}-${listItems[0].data.id}` : null)

  const selectedItem = listItems.find(
    (item) => `${item.kind}-${item.data.id}` === effectiveKey
  )

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key)
    setMobileView('detail')
  }, [])

  const tabs: { id: TabFilter; label: string; shortLabel: string; count: number }[] = [
    { id: 'all', label: 'All', shortLabel: 'All', count: allItems.length },
    { id: 'appointments', label: 'Appointments', shortLabel: 'Appts', count: appointments.filter(a => a.ConsultationTickets.length === 0).length },
    { id: 'consultations', label: 'Consultations', shortLabel: 'Consults', count: consultationTickets.length },
  ]

  return (
    <div className="-mx-4 sm:-mx-6 md:-mx-8 -mb-6 md:-mb-8 lg:-mb-10 overflow-x-hidden">
      {/* Page Header */}
      <div className="px-4 sm:px-6 md:px-8 mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/v2/patient"
            className="flex items-center justify-center w-9 h-9 rounded-xl dark:bg-white/5 bg-slate-100/80 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 truncate">
              My Appointments & Consultations
            </h1>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
              {patientName} · {allItems.length} record{allItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Split panel — fills remaining viewport height.
           Height = 100dvh − (layout top padding + header height + header margin-bottom)
           mobile : 1.5rem pt  + ~2.75rem header + 1.25rem mb-5 ≈ 5.5rem
           md     : 2rem    pt  + ~3.25rem header + 1.25rem mb-5 ≈ 6.5rem
           lg     : 2.5rem  pt  + ~3.25rem header + 1.25rem mb-5 ≈ 7rem   */}
      <div className="flex h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7rem)] min-h-0 overflow-hidden dark:bg-slate-900/50 bg-white/60 backdrop-blur-xl rounded-t-2xl dark:border-white/8 border-slate-200/70 border-t border-x shadow-xl dark:shadow-slate-950/40">
        {/* Left: List */}
        <aside
          className={`shrink-0 flex-col dark:border-r dark:border-white/8 border-r border-slate-200/70 overflow-hidden w-full md:w-[320px] ${
            mobileView === 'detail' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Filter tabs */}
          <div className="px-3 pt-3 pb-2 shrink-0 dark:border-b dark:border-white/8 border-b border-slate-200/60">
            <div className="flex gap-1 dark:bg-slate-800/60 bg-slate-100/80 rounded-xl p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTab(t.id); setSelectedKey(null); setMobileView('list'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tab === t.id
                      ? 'dark:bg-white/10 bg-white dark:text-white text-slate-900 shadow-sm'
                      : 'dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-700'
                  }`}
                >
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="inline sm:hidden">{t.shortLabel}</span>
                  <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                    tab === t.id
                      ? 'dark:bg-white/10 bg-slate-100 dark:text-white text-slate-700'
                      : 'dark:bg-white/5 bg-slate-200/60 dark:text-slate-400 text-slate-500'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl dark:bg-white/5 bg-slate-100/60 flex items-center justify-center">
                  <Calendar className="h-6 w-6 dark:text-slate-500 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-slate-300 text-slate-600">
                    No records
                  </p>
                  <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                    {tab === 'all'
                      ? 'Your history will appear here.'
                      : `No ${tab} found.`}
                  </p>
                </div>
              </div>
            ) : (
              listItems.map((item) => {
                const key = `${item.kind}-${item.data.id}`
                return (
                  <ListItemRow
                    key={key}
                    item={item}
                    isSelected={effectiveKey === key}
                    onSelect={() => handleSelect(key)}
                  />
                )
              })
            )}
          </div>
        </aside>

        {/* Right: Detail */}
        <main
          className={`flex-1 overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          }`}
        >
          {selectedItem ? (
            selectedItem.kind === 'consultation' ? (
              <ConsultationDetailPanel
                ticket={selectedItem.data as ConsultationTicket}
                onBack={() => setMobileView('list')}
              />
            ) : (
              <AppointmentDetailPanel
                appointment={selectedItem.data as Appointment}
                onBack={() => setMobileView('list')}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl dark:bg-white/5 bg-slate-100/60 flex items-center justify-center">
                <ClipboardList className="h-7 w-7 dark:text-slate-500 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold dark:text-slate-300 text-slate-600">
                  Select a record
                </p>
                <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                  Choose an item from the list to view details.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
