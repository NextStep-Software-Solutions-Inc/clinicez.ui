'use client'

import { Copy } from 'lucide-react'

interface PhilHealthIDFieldProps {
  label: string
  value: string
  onCopy: (label: string) => void
}

export function PhilHealthIDField({ label, value, onCopy }: PhilHealthIDFieldProps) {
  return (
    <div className="bg-slate-50/10 dark:bg-white/5 p-3 rounded-lg border border-slate-300 dark:border-white/20">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-2 group">
        <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white flex-1">{value}</p>
        <button
          onClick={() => onCopy(label)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          title={`Copy ${label}`}
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
