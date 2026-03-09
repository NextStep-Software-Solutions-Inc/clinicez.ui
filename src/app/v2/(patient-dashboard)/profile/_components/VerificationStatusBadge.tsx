'use client'

import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldQuestion, ShieldAlert, Shield } from 'lucide-react'
import type { VerificationStatus } from '@prisma/client'

interface VerificationStatusBadgeProps {
  status: VerificationStatus
}

const STATUS_CONFIG: Record<VerificationStatus, {
  label: string
  icon: typeof ShieldCheck
  className: string
}> = {
  VERIFIED: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  PENDING: {
    label: 'Pending Verification',
    icon: ShieldQuestion,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },
  REJECTED: {
    label: 'Verification Rejected',
    icon: ShieldAlert,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
  UNVERIFIED: {
    label: 'Unverified',
    icon: Shield,
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
}

export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
