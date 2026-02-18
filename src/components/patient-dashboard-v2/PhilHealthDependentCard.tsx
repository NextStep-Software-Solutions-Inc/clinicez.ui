'use client'

interface PhilHealthDependentCardProps {
  firstName: string
  middleName?: string
  lastName?: string
  relationship?: string
}

export function PhilHealthDependentCard({ firstName, middleName, lastName, relationship }: PhilHealthDependentCardProps) {
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Unknown'

  return (
    <div className="text-sm p-2 rounded-lg bg-slate-50/10 dark:bg-white/5 border border-slate-300 dark:border-white/20">
      <p className="font-medium text-slate-900 dark:text-white">{fullName}</p>
      {relationship && <p className="text-xs text-slate-600 dark:text-slate-400">{relationship}</p>}
    </div>
  )
}
