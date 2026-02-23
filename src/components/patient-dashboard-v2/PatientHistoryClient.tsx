'use client'

import { useState, useCallback } from 'react'
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
  AlertCircle,
  ClipboardList,
  ArrowLeft,
} from 'lucide-react'
import type { GetPatientSelfHistory } from '@/actions/patient-dashboard/get-self-history'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'

type HistoryData = NonNullable<GetPatientSelfHistory['data']>
type Appointment = HistoryData['appointments'][number]
type ConsultationTicket = HistoryData['consultationTickets'][number]

interface PatientHistoryClientProps {
  patientName: string
  appointments: HistoryData['appointments']
  consultationTickets: HistoryData['consultationTickets']
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getConsultationStatusColor(status?: string | null): string {
  switch (status) {
    case 'RESOLVED':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-400/30'
    case 'PROCESSING':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30'
    default:
      return 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-400/30'
  }
}

function getAppointmentStatusColor(status?: string | null): string {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-400/30'
    case 'CANCELLED':
    case 'DECLINED':
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/30'
    case 'RESCHEDULED':
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30'
    default:
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30'
  }
}

// ---------------------------------------------------------------------------
// Unified list item
// ---------------------------------------------------------------------------

type ListItem =
  | { kind: 'consultation'; data: ConsultationTicket; date: Date }
  | { kind: 'appointment'; data: Appointment; date: Date }

// ---------------------------------------------------------------------------
// Detail panels
// ---------------------------------------------------------------------------

function ConsultationDetailPanel({ ticket }: { ticket: ConsultationTicket }) {
  const hps = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider)
  const appointment = ticket.Appointment

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getConsultationStatusColor(
              ticket.ConsultationTicketAttribute?.status
            )}`}
          >
            {ticket.ConsultationTicketAttribute?.status === 'RESOLVED' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : ticket.isArchived ? (
              <Archive className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {ticket.isArchived
              ? 'Archived'
              : (ticket.ConsultationTicketAttribute?.status ?? 'Open')}
          </span>
          {ticket.caseNumber && (
            <span className="text-xs dark:text-slate-400 text-slate-500">
              Case #{ticket.caseNumber}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold dark:text-white text-slate-900">
          {ticket.subject ?? 'Consultation'}
        </h2>
        {ticket.Clinic && (
          <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
            {ticket.Clinic.name}
          </p>
        )}
        <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Healthcare Providers */}
      {hps.length > 0 && (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-4">
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-3">
            Your Doctors
          </p>
          <div className="flex flex-col gap-2">
            {hps.map((hp) => (
              <div key={hp.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-4 w-4 text-purple-500" />
                </div>
                <div>
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
                  {hp.HPType?.name && (
                    <p className="text-xs dark:text-slate-400 text-slate-500">
                      {hp.HPType.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Appointment */}
      {appointment && (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-4">
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-3">
            Linked Appointment
          </p>
          <p className="text-sm font-medium dark:text-white text-slate-900">
            {appointment.subject ?? appointment.complaint ?? 'Appointment'}
          </p>
          {appointment.AppointmentAttribute && (
            <div className="flex flex-wrap gap-2 mt-2">
              {appointment.AppointmentAttribute.date && (
                <span className="flex items-center gap-1 text-xs dark:text-slate-400 text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(appointment.AppointmentAttribute.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
              {appointment.AppointmentAttribute.AppointmentType?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600">
                  {appointment.AppointmentAttribute.AppointmentType.name}
                </span>
              )}
              {appointment.AppointmentAttribute.Service?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full dark:bg-slate-700/60 bg-slate-200/60 dark:text-slate-300 text-slate-600">
                  {appointment.AppointmentAttribute.Service.name}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Consultation Notes */}
      {ticket.ConsultationNotes.length > 0 ? (
        <div>
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-3">
            Doctor&apos;s Notes
          </p>
          <div className="flex flex-col gap-3">
            {ticket.ConsultationNotes.map((note) => (
              <div
                key={note.id}
                className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-lg p-4 dark:border-white/10 border-slate-200/60 border"
              >
                <p className="text-xs font-semibold dark:text-purple-400 text-purple-600 uppercase tracking-wide mb-1.5">
                  {note.section}
                </p>
                <p className="text-sm dark:text-slate-200 text-slate-800 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-green-500/20 dark:text-green-300 dark:border-green-400/30 bg-green-100/60 text-green-700 border-green-300/50 border">
                    Visible to you
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-8 text-center">
          <FileText className="h-10 w-10 mx-auto dark:text-slate-500 text-slate-400 mb-3" />
          <p className="text-sm dark:text-slate-400 text-slate-500">
            No notes have been shared with you for this consultation.
          </p>
        </div>
      )}

      {/* Attachments summary */}
      {(ticket.Prescriptions.length > 0 ||
        ticket.MedicalCertificates.length > 0 ||
        ticket.LaboratoryRequests.length > 0 ||
        ticket.ImagingRequests.length > 0) && (
        <div>
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-2">
            From This Visit
          </p>
          <div className="flex flex-wrap gap-2">
            {ticket.Prescriptions.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 bg-emerald-100/60 text-emerald-700 border-emerald-300/50 border rounded-full px-3 py-1">
                <Pill className="h-3.5 w-3.5" />
                {ticket.Prescriptions.length} Prescription
                {ticket.Prescriptions.length !== 1 ? 's' : ''}
              </span>
            )}
            {ticket.MedicalCertificates.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30 bg-blue-100/60 text-blue-700 border-blue-300/50 border rounded-full px-3 py-1">
                <FileCheck className="h-3.5 w-3.5" />
                {ticket.MedicalCertificates.length} Certificate
                {ticket.MedicalCertificates.length !== 1 ? 's' : ''}
              </span>
            )}
            {ticket.LaboratoryRequests.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400/30 bg-purple-100/60 text-purple-700 border-purple-300/50 border rounded-full px-3 py-1">
                <TestTube className="h-3.5 w-3.5" />
                {ticket.LaboratoryRequests.length} Lab Request
                {ticket.LaboratoryRequests.length !== 1 ? 's' : ''}
              </span>
            )}
            {ticket.ImagingRequests.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-400/30 bg-orange-100/60 text-orange-700 border-orange-300/50 border rounded-full px-3 py-1">
                <Scan className="h-3.5 w-3.5" />
                {ticket.ImagingRequests.length} Imaging
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentDetailPanel({ appointment }: { appointment: Appointment }) {
  const attr = appointment.AppointmentAttribute
  const hp = appointment.AppointmentRouting[0]?.RoutedTo

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        {attr && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mb-2 ${getAppointmentStatusColor(
              attr.status
            )}`}
          >
            {attr.status}
          </span>
        )}
        <h2 className="text-xl font-bold dark:text-white text-slate-900">
          {appointment.subject ?? appointment.complaint ?? 'Appointment'}
        </h2>
        {appointment.Clinic && (
          <p className="text-sm dark:text-slate-400 text-slate-500 mt-0.5">
            {appointment.Clinic.name}
          </p>
        )}
        <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
          {new Date(appointment.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Appointment Details */}
      {attr && (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-4">
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-3">
            Appointment Details
          </p>
          <div className="flex flex-col gap-2.5">
            {attr.date && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="h-4 w-4 dark:text-slate-400 text-slate-500 shrink-0" />
                <span className="dark:text-white text-slate-900">
                  {new Date(attr.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {attr.timeStart && ` · ${attr.timeStart}`}
                  {attr.timeEnd && ` – ${attr.timeEnd}`}
                </span>
              </div>
            )}
            {attr.AppointmentType?.name && (
              <div className="flex items-center gap-2.5 text-sm">
                <ClipboardList className="h-4 w-4 dark:text-slate-400 text-slate-500 shrink-0" />
                <span className="dark:text-white text-slate-900">
                  {attr.AppointmentType.name}
                </span>
              </div>
            )}
            {attr.AppointmentMode?.name && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="h-4 w-4 dark:text-slate-400 text-slate-500 shrink-0" />
                <span className="dark:text-white text-slate-900">
                  {attr.AppointmentMode.name}
                </span>
              </div>
            )}
            {attr.Service?.name && (
              <div className="flex items-center gap-2.5 text-sm">
                <Stethoscope className="h-4 w-4 dark:text-slate-400 text-slate-500 shrink-0" />
                <span className="dark:text-white text-slate-900">
                  {attr.Service.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Provider */}
      {hp && (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-4">
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-2">
            Healthcare Provider
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-sm dark:text-white text-slate-900">
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
        </div>
      )}

      {/* Complaint */}
      {appointment.complaint && (
        <div>
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wide mb-1.5">
            Chief Complaint
          </p>
          <p className="text-sm dark:text-slate-200 text-slate-800">
            {appointment.complaint}
          </p>
        </div>
      )}

      {/* No consultation recorded */}
      {appointment.ConsultationTickets.length === 0 && (
        <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-6 text-center">
          <Stethoscope className="h-10 w-10 mx-auto dark:text-slate-500 text-slate-400 mb-3" />
          <p className="text-sm dark:text-slate-400 text-slate-500">
            No consultation notes have been recorded for this appointment yet.
          </p>
        </div>
      )}
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
  const listItems: ListItem[] = [
    ...consultationTickets.map(
      (t): ListItem => ({
        kind: 'consultation',
        data: t,
        date: new Date(t.createdAt),
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
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const [selectedKey, setSelectedKey] = useState<string | null>(
    listItems[0] ? `${listItems[0].kind}-${listItems[0].data.id}` : null
  )
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const selectedItem = listItems.find(
    (item) => `${item.kind}-${item.data.id}` === selectedKey
  )

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key)
    setMobileView('detail')
  }, [])

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/v2/patient"
            className="flex items-center gap-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
              My Appointments & Consultations
            </h1>
            <p className="text-sm dark:text-slate-400 text-slate-600">
              {consultationTickets.length} consultation{consultationTickets.length !== 1 ? 's' : ''} ·{' '}
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Split panel */}
      <div className="flex h-[calc(100dvh-14rem)] overflow-hidden dark:bg-slate-800/30 bg-white/40 backdrop-blur-xl rounded-2xl dark:border-white/10 border-slate-200/60 border shadow-lg dark:shadow-slate-900/30">
        {/* Mobile: back button */}
        {mobileView === 'detail' && (
          <div className="md:hidden absolute top-0 left-0 right-0 z-10">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}

        {/* Left: List */}
        <aside
          className={`shrink-0 flex-col dark:border-r dark:border-white/10 border-r border-slate-200/60 overflow-hidden w-full md:w-80 ${
            mobileView === 'detail' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3 dark:border-b dark:border-white/10 border-b border-slate-200/60 shrink-0">
            <p className="text-sm font-semibold dark:text-white text-slate-900">{patientName}</p>
            <p className="text-xs dark:text-slate-400 text-slate-500">
              {listItems.length} total record{listItems.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:dark:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-14 h-14 rounded-full dark:bg-white/5 bg-slate-100/60 flex items-center justify-center">
                  <Calendar className="h-7 w-7 dark:text-slate-500 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-slate-300 text-slate-600">
                    No history yet
                  </p>
                  <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
                    Your appointments and consultations will appear here.
                  </p>
                </div>
              </div>
            ) : (
              listItems.map((item) => {
                const key = `${item.kind}-${item.data.id}`
                const isSelected = selectedKey === key

                if (item.kind === 'consultation') {
                  const ticket = item.data as ConsultationTicket
                  const status = ticket.ConsultationTicketAttribute?.status
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelect(key)}
                      className={`w-full text-left px-4 py-3 dark:border-b dark:border-white/5 border-b border-slate-200/60 transition-colors dark:hover:bg-white/5 hover:bg-slate-100/60 ${
                        isSelected
                          ? 'dark:bg-purple-500/10 bg-purple-50/60 dark:border-l-2 dark:border-l-purple-400 border-l-2 border-l-purple-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Stethoscope className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <p className="text-sm font-medium dark:text-white text-slate-900 line-clamp-1">
                            {ticket.subject ?? 'Consultation'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${getConsultationStatusColor(
                            status
                          )}`}
                        >
                          {status ?? 'Open'}
                        </span>
                      </div>
                      {ticket.Clinic && (
                        <p className="text-xs dark:text-slate-500 text-slate-400 ml-5">
                          {ticket.Clinic.name}
                        </p>
                      )}
                      {ticket.caseNumber && (
                        <p className="text-xs dark:text-slate-500 text-slate-400 ml-5">
                          Case #{ticket.caseNumber}
                        </p>
                      )}
                      <p className="text-xs dark:text-slate-500 text-slate-400 mt-1 ml-5">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {ticket.ConsultationNotes.length > 0 && (
                        <div className="flex items-center gap-2 mt-1.5 ml-5">
                          <span className="flex items-center gap-1 text-xs dark:text-slate-500 text-slate-400">
                            <FileText className="h-3 w-3" />
                            {ticket.ConsultationNotes.length} note
                            {ticket.ConsultationNotes.length !== 1 ? 's' : ''}
                          </span>
                          {ticket.Prescriptions.length > 0 && (
                            <span className="flex items-center gap-1 text-xs dark:text-slate-500 text-slate-400">
                              <Pill className="h-3 w-3" />
                              {ticket.Prescriptions.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                }

                const appt = item.data as Appointment
                const aptStatus = appt.AppointmentAttribute?.status
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`w-full text-left px-4 py-3 dark:border-b dark:border-white/5 border-b border-slate-200/60 transition-colors dark:hover:bg-white/5 hover:bg-slate-100/60 ${
                      isSelected
                        ? 'dark:bg-blue-500/10 bg-blue-50/60 dark:border-l-2 dark:border-l-blue-400 border-l-2 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <p className="text-sm font-medium dark:text-white text-slate-900 line-clamp-1">
                          {appt.subject ?? appt.complaint ?? 'Appointment'}
                        </p>
                      </div>
                      {aptStatus && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${getAppointmentStatusColor(
                            aptStatus
                          )}`}
                        >
                          {aptStatus}
                        </span>
                      )}
                    </div>
                    {appt.Clinic && (
                      <p className="text-xs dark:text-slate-500 text-slate-400 ml-5">
                        {appt.Clinic.name}
                      </p>
                    )}
                    {appt.AppointmentAttribute?.date && (
                      <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5 ml-5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 inline" />
                        {new Date(appt.AppointmentAttribute.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right: Detail */}
        <main
          className={`flex-1 overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedItem ? (
            selectedItem.kind === 'consultation' ? (
              <ConsultationDetailPanel ticket={selectedItem.data as ConsultationTicket} />
            ) : (
              <AppointmentDetailPanel appointment={selectedItem.data as Appointment} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-full dark:bg-white/5 bg-slate-100/60 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 dark:text-slate-500 text-slate-400" />
              </div>
              <p className="text-sm dark:text-slate-400 text-slate-500">
                Select a record from the list to view details.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
