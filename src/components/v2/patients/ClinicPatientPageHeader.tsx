'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, Users, User, Calendar, History, Home, FolderOpen, Folder } from 'lucide-react'

interface ClinicPatientPageHeaderProps {
  clinicUid: string
  patientId: number
  patientName: string
  /** 'view' shows: Patients > Patient Name
   *  'consultations' shows: Patients > Patient Name > Consultations
   *  'appointments-consultations' shows: Patients > Patient Name > Appointments & Consultations
   *  'files' shows: Patients > Patient Name > Files (and dynamic folder name) */
  mode: 'view' | 'consultations' | 'appointments-consultations' | 'files'
  folderName?: string
}

export function ClinicPatientPageHeader({
  clinicUid,
  patientId,
  patientName,
  mode,
  folderName,
}: ClinicPatientPageHeaderProps) {
  // Determine dynamic back button destination based on context mode
  const backHref = mode === 'files'
    ? (folderName ? `/v2/clinic/${clinicUid}/patients/${patientId}/files` : `/v2/clinic/${clinicUid}/patients/${patientId}`)
    : `/v2/clinic/${clinicUid}/patients`

  return (
    <div className="sticky top-12 z-40 h-12 flex items-center backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs px-3 py-1.5 sm:py-2">
      <div className="flex items-center gap-4">
        {/* Sleek Circular Back Button */}
        <Link
          href={backHref}
          onClick={(e) => {
            // When in files sub-folder mode, clicking back should instantly update query params and trigger popstate
            if (mode === 'files' && folderName) {
              e.preventDefault()
              const params = new URLSearchParams(window.location.search)
              params.delete('folderId')
              window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
              window.dispatchEvent(new Event('popstate'))
            }
          }}
          className="group flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-sm transition-all duration-200 shrink-0"
          title={folderName ? "Back to Folders" : "Back"}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </Link>

        {/* Elegant Glassmorphic Breadcrumbs Pill */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/40 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-lg shadow-sm min-w-0"
        >
          {/* Home Icon Link */}
          <Link
            href={`/v2/clinic/${clinicUid}/dashboard`}
            className="flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 transition-colors p-0.5 rounded-md"
            title="Clinic Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>

          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-650 shrink-0" />

          {/* Patients Index Link */}
          <Link
            href={`/v2/clinic/${clinicUid}/patients`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Patients</span>
          </Link>

          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-650 shrink-0" />

          {/* Patient Profile Href Link */}
          {mode === 'view' ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800 truncate">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
              <span className="truncate max-w-[150px]">{patientName}</span>
            </span>
          ) : (
            <>
              <Link
                href={`/v2/clinic/${clinicUid}/patients/${patientId}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 truncate"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[100px]">{patientName}</span>
              </Link>

              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-650 shrink-0" />

              {mode === 'consultations' ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                  <History className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
                  <span>Consultations</span>
                </span>
              ) : mode === 'appointments-consultations' ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
                  <span>Appointments &amp; Consultations</span>
                </span>
              ) : (
                <>
                  {folderName ? (
                    <>
                      <Link
                        href={`/v2/clinic/${clinicUid}/patients/${patientId}/files`}
                        onClick={(e) => {
                          e.preventDefault()
                          const params = new URLSearchParams(window.location.search)
                          params.delete('folderId')
                          window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
                          window.dispatchEvent(new Event('popstate'))
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Files</span>
                      </Link>

                      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-650 shrink-0" />

                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800 truncate">
                        <Folder className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
                        <span className="truncate max-w-[150px]">{folderName}</span>
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                      <FolderOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
                      <span>Files</span>
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </div>
  )
}
