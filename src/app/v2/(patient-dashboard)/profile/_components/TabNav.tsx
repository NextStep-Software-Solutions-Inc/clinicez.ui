'use client'

import type { LucideIcon } from 'lucide-react'
import type { TabBadge } from '../_lib/tab-badges'

export interface ProfileTab {
  id: string
  label: string
  icon: LucideIcon
}

interface TabNavProps {
  tabs: ProfileTab[]
  activeTab: string
  badges: Record<string, TabBadge | null>
  onTabChange: (tabId: string) => void
}

export function TabNav({ tabs, activeTab, badges, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
      {tabs.map(tab => {
        const badge = badges[tab.id]
        const isActive = activeTab === tab.id
        const TabIcon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
              isActive
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md shadow-teal-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <TabIcon className="w-4 h-4" />
            <span>{tab.label}</span>
            {badge && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/25 text-white'
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

