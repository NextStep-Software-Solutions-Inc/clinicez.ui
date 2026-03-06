'use client'

import type { TabBadge } from '../_lib/tab-badges'

export interface ProfileTab {
  id: string
  label: string
  icon: string
}

interface TabNavProps {
  tabs: ProfileTab[]
  activeTab: string
  badges: Record<string, TabBadge | null>
  onTabChange: (tabId: string) => void
}

export function TabNav({ tabs, activeTab, badges, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
      {tabs.map(tab => {
        const badge = badges[tab.id]
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'dark:bg-white/10 dark:text-slate-300 bg-slate-100 text-slate-700 hover:dark:bg-white/20 hover:bg-slate-200'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {badge && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200'
              }`}>
                {badge.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
