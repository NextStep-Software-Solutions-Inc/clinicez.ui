'use client'

interface PhilHealthCountCardProps {
  label: string
  count: number
}

export function PhilHealthCountCard({ label, count }: PhilHealthCountCardProps) {
  return (
    <div className="bg-purple-50/10 dark:bg-purple-500/5 p-3 rounded-lg border border-purple-300 dark:border-purple-400/50">
      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">{count}</p>
    </div>
  )
}
