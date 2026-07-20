'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updateFamilyMedicalConditions } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { HealthConditionsCombobox } from '@/components/health-records/HealthConditionsCombobox'
import { toast } from 'sonner'

export interface FamilyMedicalHistoryInlineFormProps {
  userId: string
  currentHistory?: any[]
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function FamilyMedicalHistoryInlineForm({
  userId,
  currentHistory = [],
  onSuccess,
  saveRef,
  onDirtyChange,
}: FamilyMedicalHistoryInlineFormProps) {
  const initialValue = useMemo(() => {
    return currentHistory.map((c) => ({
      conditionId: c.conditionId || c.id,
      details: c.details || '',
    }))
  }, [currentHistory])

  const [conditions, setConditions] = useState<any[]>(initialValue)

  const hasChanges = useMemo(() => {
    return JSON.stringify(conditions) !== JSON.stringify(initialValue)
  }, [conditions, initialValue])

  useEffect(() => {
    onDirtyChange?.(hasChanges)
  }, [hasChanges, onDirtyChange])

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    if (conditions.length === 0) {
      toast.error('Please add at least one family medical condition.')
      throw new Error('Family history list is empty')
    }

    try {
      const result = await updateFamilyMedicalConditions(userId, {
        conditions: conditions.map((c) => ({
          conditionId: c.conditionId,
          details: c.details || null,
        })),
      })

      if (result.success) {
        toast.success(result.message || 'Family history updated successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to update family history')
        throw new Error(result.error || 'Failed to update')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to update family history'))
      throw err
    }
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = { submit: handleSubmit, hasChanges }
    }
    return () => {
      if (saveRef) saveRef.current = null
    }
  }, [saveRef, conditions, hasChanges])

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          Search and Manage Family Conditions
        </label>
        <HealthConditionsCombobox
          value={conditions}
          onChange={(newVal) => setConditions(newVal)}
        />
      </div>
    </div>
  )
}
