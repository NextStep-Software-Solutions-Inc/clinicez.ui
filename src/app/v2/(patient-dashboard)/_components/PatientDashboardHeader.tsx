'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { NotificationBell } from '@/components/v2/notifications/NotificationBell'
import { useHeaderTitle } from './HeaderTitleContext'
import InstallPWAButton from '@/components/pwa/install-pwa-button'
import {
  APP_ROOT_PATH,
  getPatientDashboardPageTitle,
  isPatientDashboardRouteActive,
  PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH,
  PATIENT_DASHBOARD_HOME_PATH,
  PATIENT_DASHBOARD_INTEGRATIONS_PATH,
  PATIENT_DASHBOARD_NAV_ITEMS,
} from './patient-dashboard-routes'

export function PatientDashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === PATIENT_DASHBOARD_HOME_PATH
  const title = getPatientDashboardPageTitle(pathname)
  const { overrideTitle, overrideBack } = useHeaderTitle()

  const displayTitle = overrideTitle ?? title
  const handleBack = overrideBack ? overrideBack.fn : () => router.back()
  const logo = (
    <Image
      src="/assets/clinic-ez_mini-logo.svg"
      alt="ClinicEZ"
      width={32}
      height={32}
      className="rounded"
      priority
    />
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 md:top-4 md:left-1/2 md:right-auto md:w-[min(100%-2rem,72rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:shadow-sm">
      <div className="mx-auto h-full flex items-center gap-2 px-4 max-w-screen-sm md:max-w-none">
        {/* Left: Mobile (home logo/back+title), Desktop (always logo + optional title) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none md:min-w-[220px]">
          <Link href={APP_ROOT_PATH} aria-label="Go to ClinicEZ home page" className="hidden md:flex items-center gap-2">
            {logo}
          </Link>

          {isHome ? (
            <Link href={APP_ROOT_PATH} aria-label="Go to ClinicEZ home page" className="flex items-center gap-2 md:hidden">
              {logo}
            </Link>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {displayTitle && (
                <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate md:hidden">
                  {displayTitle}
                </h1>
              )}
            </>
          )}

          {!isHome && displayTitle && (
            <h1 className="hidden md:block text-sm font-semibold text-slate-900 dark:text-white truncate">
              {displayTitle}
            </h1>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {PATIENT_DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = isPatientDashboardRouteActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Link
            href={PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </Link>
          {isHome && (
            <Link
              href={PATIENT_DASHBOARD_INTEGRATIONS_PATH}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Integrations"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <InstallPWAButton />
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
