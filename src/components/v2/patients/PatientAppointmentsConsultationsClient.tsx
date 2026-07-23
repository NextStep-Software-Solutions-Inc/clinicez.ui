'use client'

import React from 'react'
import Link from 'next/link'
import {
  Calendar,
  Stethoscope,
  Clock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Pill,
  TestTube,
  Scan,
  AlertCircle,
  User,
  ArrowLeft,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import dayjs from '@/lib/day-utils'
import type { GetPatientHistoryResult } from '@/actions/clinics/get-patient-history.action'
import type { PatientHistoryAccess } from '@/actions/clinics/get-patient-history.action'

type HistoryData = NonNullable<GetPatientHistoryResult['data']>
type Appointment = HistoryData['appointments'][number]
type ConsultationTicket = HistoryData['consultationTickets'][number]

interface PatientAppointmentsConsultationsClientProps {
  clinicUid: string
  patientId: number
  patientName: string
  appointments: HistoryData['appointments']
  consultationTickets: HistoryData['consultationTickets']
  access: PatientHistoryAccess
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getConsultationStatusBadge(status?: string | null) {
  switch (status) {
    case 'RESOLVED':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
        </Badge>
      )
    case 'PROCESSING':
      return (
        <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <Clock className="w-3 h-3 mr-1" /> Processing
        </Badge>
      )
    case 'DROPPED':
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <AlertCircle className="w-3 h-3 mr-1" /> Dropped
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          {status || 'Draft'}
        </Badge>
      )
  }
}

function getAppointmentStatusBadge(status?: string | null) {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return (
        <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {status}
        </Badge>
      )
    case 'PENDING':
    case 'ROUTED':
    case 'RECEIVED':
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <Clock className="w-3 h-3 mr-1" /> {status}
        </Badge>
      )
    case 'CANCELLED':
    case 'DECLINED':
    case 'DROPPED':
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          <AlertCircle className="w-3 h-3 mr-1" /> {status}
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0">
          {status || 'Scheduled'}
        </Badge>
      )
  }
}

// ---------------------------------------------------------------------------
// Unified list item type
// ---------------------------------------------------------------------------

type ListItem =
  | { kind: 'consultation'; data: ConsultationTicket; date: Date }
  | { kind: 'appointment'; data: Appointment; date: Date }

// ---------------------------------------------------------------------------
// Timeline entry components (Dense & Compact)
// ---------------------------------------------------------------------------

function ConsultationTimelineEntry({
  ticket,
  access,
  isLast,
}: {
  ticket: ConsultationTicket
  access: PatientHistoryAccess
  isLast: boolean
}) {
  const status = ticket.ConsultationTicketAttribute?.status
  const hps = ticket.ConsultationTicketHPs.map((h) => h.HealthCareProvider)
  const appointment = ticket.Appointment

  const sections = ticket.ConsultationTicketAttribute?.NoteTemplate?.NoteSections ?? []
  const sectionLabelByName = new Map<string, string>(
    sections.map((s) => [s.name, s.label])
  )
  const sectionLabelById = new Map<string, string>(
    sections.map((s) => [String(s.id), s.label])
  )

  const notes = (ticket as any).ConsultationNotes ?? (ticket as any).ConsultationTicketNotes ?? []
  const filledFields = (notes as any[]).filter(
    (f: any) => f.value && typeof f.value === 'string' && f.value.trim() !== ''
  )
  const rxCount = (ticket as any).ConsultationPrescriptions?.length ?? 0
  const labCount = (ticket as any).ConsultationLabOrders?.length ?? 0
  const radCount = (ticket as any).ConsultationRadOrders?.length ?? 0

  return (
    <div className="relative flex gap-3 sm:gap-4">
      {/* Dense Timeline Connector */}
      <div className="relative flex flex-col items-center shrink-0 w-4 sm:w-5">
        <div className="w-3 h-3 rounded-full bg-teal-500 ring-2 ring-teal-500/30 mt-1 shrink-0 z-10" />
        {!isLast && <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 mt-1" />}
      </div>

      {/* Dense Card Container */}
      <div className="flex-1 min-w-0 pb-4 sm:pb-5">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all space-y-2.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                  <Stethoscope className="h-2.5 w-2.5" /> Consultation
                </span>
                {ticket.caseNumber && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Case #{ticket.caseNumber}
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {ticket.subject || ticket.Appointment?.subject || ticket.Appointment?.complaint || 'Consultation Note'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {dayjs(ticket.createdAt).format('MMMM D, YYYY [at] h:mm A')}
              </p>
            </div>
            {getConsultationStatusBadge(status)}
          </div>

          {/* Providers */}
          {hps.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <User className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {hps
                  .map((hp) =>
                    [
                      hp.HPProfile?.title,
                      hp.HPProfile?.name ||
                        `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
                      hp.HPProfile?.suffix,
                      hp.HPType?.name ? `(${hp.HPType.name})` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  )
                  .join(', ')}
              </span>
            </div>
          )}

          {/* Linked Appointment */}
          {appointment && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 truncate">
              <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-semibold truncate">
                Linked: {appointment.subject ?? appointment.complaint ?? 'Scheduled'}
              </span>
            </div>
          )}

          {/* Key Findings Preview */}
          {filledFields.length > 0 ? (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              {filledFields.slice(0, 2).map((field: any) => {
                const sectionKey = field.section || field.noteSectionId
                const label =
                  sectionLabelByName.get(sectionKey) ??
                  sectionLabelById.get(String(sectionKey)) ??
                  sectionKey
                return (
                  <div key={field.id || field.noteSectionId} className="text-[11px]">
                    <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400 dark:text-slate-500 block">
                      {label}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 mt-0.5">
                      {field.value}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-0.5">
              No detailed clinical notes recorded.
            </p>
          )}

          {/* Auxiliary Order Badges */}
          {(rxCount > 0 || labCount > 0 || radCount > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              {rxCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0 border-slate-200 dark:border-slate-700">
                  <Pill className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                  {rxCount} Rx
                </Badge>
              )}
              {labCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0 border-slate-200 dark:border-slate-700">
                  <TestTube className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />
                  {labCount} Lab
                </Badge>
              )}
              {radCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0 border-slate-200 dark:border-slate-700">
                  <Scan className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                  {radCount} Imaging
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentTimelineEntry({
  appointment,
  isLast,
}: {
  appointment: Appointment
  isLast: boolean
}) {
  const attr = appointment.AppointmentAttribute
  const hp = appointment.AppointmentRouting[0]?.RoutedTo

  return (
    <div className="relative flex gap-3 sm:gap-4">
      {/* Dense Timeline Connector */}
      <div className="relative flex flex-col items-center shrink-0 w-4 sm:w-5">
        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-slate-200 dark:ring-slate-800 mt-1 shrink-0 z-10" />
        {!isLast && <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 mt-1" />}
      </div>

      {/* Dense Card Container */}
      <div className="flex-1 min-w-0 pb-4 sm:pb-5">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all space-y-2.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  <Calendar className="h-2.5 w-2.5" /> Appointment
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {appointment.subject ?? appointment.complaint ?? 'Scheduled Appointment'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {attr?.date
                  ? dayjs(attr.date).format('MMMM D, YYYY') +
                    (attr.timeStart ? ` at ${attr.timeStart}` : '') +
                    (attr.timeEnd ? ` – ${attr.timeEnd}` : '')
                  : dayjs(appointment.createdAt).format('MMMM D, YYYY [at] h:mm A')}
              </p>
            </div>
            {getAppointmentStatusBadge(attr?.status)}
          </div>

          {/* Type / Mode / Service badges */}
          {attr && (
            <div className="flex flex-wrap gap-1">
              {attr.AppointmentType?.name && (
                <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0 border-slate-200 dark:border-slate-700">
                  <ClipboardList className="h-2.5 w-2.5 text-slate-400" />
                  {attr.AppointmentType.name}
                </Badge>
              )}
              {attr.AppointmentMode?.name && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-slate-200 dark:border-slate-700">
                  {attr.AppointmentMode.name}
                </Badge>
              )}
              {attr.Service?.name && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-slate-200 dark:border-slate-700">
                  {attr.Service.name}
                </Badge>
              )}
            </div>
          )}

          {/* Assigned provider */}
          {hp && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <Stethoscope className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {[
                  hp.HPProfile?.title,
                  hp.HPProfile?.name ||
                    `${hp.User?.firstName ?? ''} ${hp.User?.lastName ?? ''}`.trim(),
                  hp.HPProfile?.suffix,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
            </div>
          )}

          {/* Chief complaint */}
          {appointment.complaint && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                Chief Complaint
              </span>
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {appointment.complaint}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PatientAppointmentsConsultationsClient({
  clinicUid,
  patientId,
  patientName,
  appointments,
  consultationTickets,
  access,
}: PatientAppointmentsConsultationsClientProps) {
  // Build a unified, sorted list
  const listItems: ListItem[] = [
    ...consultationTickets.map(
      (t): ListItem => ({
        kind: 'consultation',
        data: t,
        date: new Date(t.createdAt),
      })
    ),
    // Only show appointments that have NO consultation ticket (avoid duplicates)
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

  // Patient Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-3 sm:px-4 py-3 sm:py-4 pb-20 sm:pb-24">
      {/* High-Density Patient Header Banner Card (Shares exact same max-w-4xl as Timeline) */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 backdrop-blur-xl p-3 sm:p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href={`/v2/clinic/${clinicUid}/patients/${patientId}`}
              className="group flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-xs transition-all duration-200 shrink-0"
              title="Back to Patient Profile"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </Link>

            <Avatar className="w-10 h-10 sm:w-11 sm:h-11 border border-teal-500/30 shadow-xs shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-xs sm:text-sm">
                {getInitials(patientName)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5 min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {patientName}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <Badge variant="outline" className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 font-bold text-[9px] uppercase px-1.5 py-0">
                  {consultationTickets.length} Consultation{consultationTickets.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-bold text-[9px] uppercase px-1.5 py-0">
                  {appointments.length} Appointment{appointments.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          <Link href={`/v2/clinic/${clinicUid}/patients/${patientId}/consultations`} className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white h-8 px-3 text-[11px] font-semibold shadow-xs rounded-lg gap-1.5 justify-center">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Consultations Workspace</span>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-3 pt-1">
        <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Activity History & Timeline ({listItems.length})
        </h2>

        {listItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No records found</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              This patient currently has no past appointments or consultation tickets on file.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {listItems.map((item, index) => {
              const isLast = index === listItems.length - 1
              if (item.kind === 'consultation') {
                return (
                  <ConsultationTimelineEntry
                    key={`c-${item.data.id}`}
                    ticket={item.data}
                    access={access}
                    isLast={isLast}
                  />
                )
              }
              return (
                <AppointmentTimelineEntry
                  key={`a-${item.data.id}`}
                  appointment={item.data}
                  isLast={isLast}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
