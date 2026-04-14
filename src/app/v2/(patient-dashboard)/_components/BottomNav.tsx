'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Plus, User, FolderOpen } from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/v2/patient', icon: Home, label: 'Home' },
  { href: '/v2/appointments-consultations', icon: Calendar, label: 'Appointments' },
  { href: '/v2/profile', icon: User, label: 'Profile' },
  { href: '/v2/patient/files', icon: FolderOpen, label: 'Files' },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/v2/patient') {
      return pathname === '/v2/patient'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 pb-safe">
      <div className="max-w-screen-sm mx-auto h-full flex items-center justify-around px-2">
        {/* Home */}
        <Link
          href={NAV_ITEMS[0].href}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
            isActive(NAV_ITEMS[0].href)
              ? 'text-teal-600 dark:text-teal-400 scale-105'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          {isActive(NAV_ITEMS[0].href) && (
            <span className="text-[10px] font-semibold">{NAV_ITEMS[0].label}</span>
          )}
        </Link>

        {/* Appointments */}
        <Link
          href={NAV_ITEMS[1].href}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
            isActive(NAV_ITEMS[1].href)
              ? 'text-teal-600 dark:text-teal-400 scale-105'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          {isActive(NAV_ITEMS[1].href) && (
            <span className="text-[10px] font-semibold">{NAV_ITEMS[1].label}</span>
          )}
        </Link>

        {/* Center FAB — Book Appointment */}
        <Link
          href="/v2/book-appointment"
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-95 transition-transform duration-150">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </Link>

        {/* Profile */}
        <Link
          href={NAV_ITEMS[2].href}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
            isActive(NAV_ITEMS[2].href)
              ? 'text-teal-600 dark:text-teal-400 scale-105'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <User className="w-5 h-5" />
          {isActive(NAV_ITEMS[2].href) && (
            <span className="text-[10px] font-semibold">{NAV_ITEMS[2].label}</span>
          )}
        </Link>

        {/* Files */}
        <Link
          href={NAV_ITEMS[3].href}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-200 ${
            isActive(NAV_ITEMS[3].href)
              ? 'text-teal-600 dark:text-teal-400 scale-105'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          {isActive(NAV_ITEMS[3].href) && (
            <span className="text-[10px] font-semibold">{NAV_ITEMS[3].label}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}
