'use client'

import { useIsClient } from '@/hooks/use-is-client'
import { Moon, Sun, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { UserButton } from '@clerk/nextjs'

export function ProfileHeader() {
  const mounted = useIsClient()
  const { theme, setTheme } = useTheme()

  if (!mounted) return null

  return (
    <div className="flex items-center justify-end gap-4">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2.5 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/20 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 transition-all"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      {/* User Button */}
      <UserButton
        appearance={{
          elements: {
            userButtonBox: 'rounded-lg overflow-hidden',
            userButtonTrigger:
              'p-1 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/20 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all',
          },
        }}
      />
    </div>
  )
}
