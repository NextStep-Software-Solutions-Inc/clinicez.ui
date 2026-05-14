'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'
import { NotificationBell } from '@/components/v2/notifications/NotificationBell'
import { useHeaderTitle } from './HeaderTitleContext'
import InstallPWAButton from '@/components/pwa/install-pwa-button'

const PAGE_TITLE_MAP: Record<string, string> = {
  '/v2/patient': '',
  '/v2/appointments-consultations': 'My Appointments',
  '/v2/patient/files': 'My Files',
  '/v2/integrations': 'Integrations',
  '/v2/profile': 'Health Records',
  '/v2/profile/edit': 'Edit Profile',
  '/v2/profile/verification': 'Verification',
  '/v2/book-appointment': 'Book Appointment',
}

const HOME_PATH = '/v2/patient'
const ROOT_PATH = '/'
const DESKTOP_NAV_ITEMS = [
  { href: '/v2/patient', label: 'Home' },
  { href: '/v2/appointments-consultations', label: 'Appointments' },
  { href: '/v2/profile', label: 'Health Records' },
  { href: '/v2/patient/files', label: 'Files' },
] as const

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLE_MAP[pathname] !== undefined) {
    return PAGE_TITLE_MAP[pathname]
  }
  // Prefix match for dynamic routes
  for (const [path, title] of Object.entries(PAGE_TITLE_MAP)) {
    if (pathname.startsWith(path) && path !== HOME_PATH) {
      return title
    }
  }
  return ''
}

export function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === HOME_PATH
  const title = getPageTitle(pathname)
  const { overrideTitle, overrideBack } = useHeaderTitle()

  const displayTitle = overrideTitle ?? title
  const handleBack = overrideBack ? overrideBack.fn : () => router.back()
  const isDesktopRouteActive = (href: string) => {
    if (href === HOME_PATH) {
      return pathname === HOME_PATH
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 md:top-4 md:left-1/2 md:right-auto md:w-[min(100%-2rem,72rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:shadow-sm">
      <div className="mx-auto h-full flex items-center gap-2 px-4 max-w-screen-sm md:max-w-none">
        {/* Left: Logo on home; back button + page title on sub-pages */}
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none md:min-w-[220px]">
          {isHome ? (
            <Link href={ROOT_PATH} className="flex items-center gap-2">
              <Image
                src="/assets/clinic-ez_mini-logo.svg"
                alt="ClinicEZ"
                width={32}
                height={32}
                className="rounded"
                priority
              />
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
                <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                  {displayTitle}
                </h1>
              )}
            </>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = isDesktopRouteActive(item.href)
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
          {isHome && (
            <Link
              href="/v2/integrations"
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
