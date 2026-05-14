'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Plus, User, FolderOpen } from 'lucide-react'
import {
  PATIENT_DASHBOARD_APPOINTMENTS_PATH,
  isPatientDashboardRouteActive,
  PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH,
  PATIENT_DASHBOARD_FILES_PATH,
  PATIENT_DASHBOARD_HOME_PATH,
  PATIENT_DASHBOARD_NAV_ITEMS,
  PATIENT_DASHBOARD_PROFILE_PATH,
  type PatientDashboardNavHref,
} from './patient-dashboard-routes'

const NAV_ITEM_ICON_MAP: Record<
  PatientDashboardNavHref,
  React.ComponentType<{ className?: string }>
> = {
  [PATIENT_DASHBOARD_HOME_PATH]: Home,
  [PATIENT_DASHBOARD_APPOINTMENTS_PATH]: Calendar,
  [PATIENT_DASHBOARD_PROFILE_PATH]: User,
  [PATIENT_DASHBOARD_FILES_PATH]: FolderOpen,
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 pb-safe md:hidden">
      <div className="max-w-screen-sm mx-auto h-full flex items-center justify-around px-2">
        {PATIENT_DASHBOARD_NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = NAV_ITEM_ICON_MAP[item.href]
          const isActive = isPatientDashboardRouteActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 scale-105'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="text-[10px] font-semibold">{item.mobileLabel ?? item.label}</span>
              )}
            </Link>
          )
        })}

        {/* Center FAB — Book Appointment */}
        <Link
          href={PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-95 transition-transform duration-150">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </Link>

        {PATIENT_DASHBOARD_NAV_ITEMS.slice(2).map((item) => {
          const Icon = NAV_ITEM_ICON_MAP[item.href]
          const isActive = isPatientDashboardRouteActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 scale-105'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="text-[10px] font-semibold">{item.mobileLabel ?? item.label}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
