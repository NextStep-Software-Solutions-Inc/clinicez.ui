'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Calendar,
  Stethoscope,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  Pill,
  TestTube,
  Scan,
  FileCheck,
  ClipboardList,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Mail,
  CalendarCheck,
  ActivitySquare,
  Download,
  Search,
} from 'lucide-react'
import type { GetPatientSelfHistory } from '@/actions/patient-dashboard/get-self-history'
import { formatTime12Hr } from '@/lib/day-utils'
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

/** Shared shape for a healthcare provider displayed across detail panels. */
type HpItem = {
  id: number
  HPProfile: { title: string | null; name: string | null; suffix: string | null } | null
  User: { firstName: string | null; lastName: string | null } | null
  HPType: { name: string } | null
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

function ConsultationDetailPanel({ ticket }: { ticket: ConsultationTicket }) {
  const hps = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider)
  const appointment = ticket.Appointment
  const statusConfig = getConsultationStatusConfig(
    ticket.ConsultationTicketAttribute?.status,
    ticket.isArchived
  )

  // Determine the effective date to display: scheduled appointment date or creation date
  const scheduledDate = appointment?.AppointmentAttribute?.date
    ? new Date(appointment.AppointmentAttribute.date)
    : null
  const displayDate = scheduledDate ?? new Date(ticket.createdAt)

  // Build unified HP list: consultation HPs take priority; fall back to accepted appointment HPs
  const appointmentAcceptedHPs: HpItem[] = (appointment?.AppointmentRouting ?? []).map(r => r.RoutedTo)
  const appointmentPreferredHP = appointment?.AppointmentAttribute?.PreferredAppointee ?? null
  const hpsToShow: HpItem[] = hps.length > 0
    ? hps
    : appointmentAcceptedHPs.length > 0
      ? appointmentAcceptedHPs
      : appointmentPreferredHP
        ? [appointmentPreferredHP]
        : []

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="px-5 pt-5 pb-4 shrink-0 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <StatusBadge config={statusConfig} />
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
            <Stethoscope className="h-3 w-3" />
            Consultation
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
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
                {displayDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {appointment?.AppointmentAttribute?.timeStart && (
                  <span> · {formatTime12Hr(appointment.AppointmentAttribute.timeStart)}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Healthcare Providers */}
        {hpsToShow.length > 0 && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Your Healthcare Providers
            </p>
            <div className="flex flex-col gap-2">
              {hpsToShow.map((hp) => (
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

function AppointmentDetailPanel({ appointment }: { appointment: Appointment }) {
  const attr = appointment.AppointmentAttribute
  const statusConfig = getAppointmentStatusConfig(attr?.status)

  // Build the HP list: accepted routing HPs first, then preferred HP fallback
  const acceptedHPs: HpItem[] = appointment.AppointmentRouting.map(r => r.RoutedTo)
  const preferredHP = attr?.PreferredAppointee ?? null
  const hpsToShow: HpItem[] = acceptedHPs.length > 0
    ? acceptedHPs
    : preferredHP
      ? [preferredHP]
      : []

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="px-5 pt-5 pb-4 shrink-0 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {attr && <StatusBadge config={statusConfig} />}
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200/60">
            <Calendar className="h-3 w-3" />
            Appointment
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold dark:text-white text-slate-900 leading-snug">
              {appointment.subject ?? appointment.complaint ?? 'Appointment'}
            </h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {appointment.Clinic && (
                <span className="text-sm dark:text-slate-400 text-slate-500">{appointment.Clinic.name}</span>
              )}
              <span className="text-xs dark:text-slate-500 text-slate-400">
                {attr?.date
                  ? new Date(attr.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : new Date(appointment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                {attr?.timeStart && (
                  <span> · {formatTime12Hr(attr.timeStart)}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Your Healthcare Providers */}
        {hpsToShow.length > 0 && (
          <section>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2.5">
              Your Healthcare Providers
            </p>
            <div className="flex flex-col gap-2">
              {hpsToShow.map((hp) => (
                <div
                  key={hp.id}
                  className="flex items-center gap-3 dark:bg-slate-800/40 bg-slate-100/60 rounded-xl px-3.5 py-3"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-violet-500" />
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
                        .join(' ') || 'Healthcare Provider'}
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
                      {attr.timeStart && (
                        <span className="dark:text-slate-300 text-slate-600">
                          {' '}· {formatTime12Hr(attr.timeStart)}
                          {attr.timeEnd && ` – ${formatTime12Hr(attr.timeEnd)}`}
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
// Main component
// ---------------------------------------------------------------------------

export default function PatientHistoryClient({
  patientName,
  appointments,
  consultationTickets,
}: PatientHistoryClientProps) {
  const [tab, setTab] = useState<TabFilter>('all')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const allItems = useMemo<ListItem[]>(() => [
    ...consultationTickets.map(
      (t): ListItem => ({
        kind: 'consultation',
        data: t,
        date: t.Appointment?.AppointmentAttribute?.date
          ? new Date(t.Appointment.AppointmentAttribute.date)
          : new Date(t.createdAt),
      })
    ),
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

  const filteredByTab = useMemo<ListItem[]>(() => {
    if (tab === 'appointments') return allItems.filter((i) => i.kind === 'appointment')
    if (tab === 'consultations') return allItems.filter((i) => i.kind === 'consultation')
    return allItems
  }, [allItems, tab])

  const listItems = useMemo<ListItem[]>(() => {
    if (!searchQuery.trim()) return filteredByTab
    const q = searchQuery.toLowerCase()
    return filteredByTab.filter((item) => {
      if (item.kind === 'consultation') {
        const t = item.data as ConsultationTicket
        return (
          (t.subject ?? '').toLowerCase().includes(q) ||
          (t.Clinic?.name ?? '').toLowerCase().includes(q)
        )
      }
      const a = item.data as Appointment
      return (
        (a.subject ?? '').toLowerCase().includes(q) ||
        (a.complaint ?? '').toLowerCase().includes(q) ||
        (a.Clinic?.name ?? '').toLowerCase().includes(q)
      )
    })
  }, [filteredByTab, searchQuery])

  const handleToggleExpand = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key))
  }, [])

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allItems.length },
    { id: 'appointments', label: 'Appointments', count: appointments.filter(a => a.ConsultationTickets.length === 0).length },
    { id: 'consultations', label: 'Consultations', count: consultationTickets.length },
  ]

  return (
    <div className="px-0">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search records…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
        />
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setExpandedKey(null); }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
              tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Record count */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {patientName} · {listItems.length} record{listItems.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {listItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Calendar className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No records yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {searchQuery ? 'No records match your search.' : tab === 'all' ? 'Your history will appear here.' : `No ${tab} found.`}
          </p>
        </div>
      ) : (
        listItems.map((item) => {
          const key = `${item.kind}-${item.data.id}`
          const isExpanded = expandedKey === key

          if (item.kind === 'consultation') {
            const ticket = item.data as ConsultationTicket
            const cfg = getConsultationStatusConfig(
              ticket.ConsultationTicketAttribute?.status,
              ticket.isArchived
            )
            const displayDate = ticket.Appointment?.AppointmentAttribute?.date
              ? new Date(ticket.Appointment.AppointmentAttribute.date)
              : new Date(ticket.createdAt)

            return (
              <div
                key={key}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3 overflow-hidden"
              >
                {/* Collapsed row */}
                <button
                  type="button"
                  onClick={() => handleToggleExpand(key)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${cfg.badge}`}>
                      <cfg.Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                    {ticket.subject ?? 'Consultation'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {ticket.Clinic && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{ticket.Clinic.name}</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Stethoscope className="h-3 w-3" />
                      Consultation
                    </span>
                  </div>
                </button>
                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    <ConsultationDetailPanel ticket={ticket} />
                  </div>
                )}
              </div>
            )
          }

          const appt = item.data as Appointment
          const cfg = getAppointmentStatusConfig(appt.AppointmentAttribute?.status)
          const displayDate = appt.AppointmentAttribute?.date
            ? new Date(appt.AppointmentAttribute.date)
            : new Date(appt.createdAt)

          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3 overflow-hidden"
            >
              {/* Collapsed row */}
              <button
                type="button"
                onClick={() => handleToggleExpand(key)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  {appt.AppointmentAttribute?.status ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${cfg.badge}`}>
                      <cfg.Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
                      Appointment
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                  {appt.subject ?? appt.complaint ?? 'Appointment'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {appt.Clinic && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{appt.Clinic.name}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Appointment
                  </span>
                </div>
              </button>
              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <AppointmentDetailPanel appointment={appt} />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
