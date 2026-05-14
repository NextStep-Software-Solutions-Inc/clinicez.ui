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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-screen-sm mx-auto h-full flex items-center justify-between px-4">
        {/* Left: Logo on home; back button + page title on sub-pages */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {isHome ? (
            <Link href={HOME_PATH} className="flex items-center gap-2">
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
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
