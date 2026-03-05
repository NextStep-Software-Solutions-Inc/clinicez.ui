'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updateMedicalConditions } from '@/actions/patient-profile'
import { medicalHistorySchema, medicalHistoryGuidance, type MedicalHistoryFormInput } from '@/schemas'
import { FormModal, EditButton } from './index'
import { HealthConditionsCombobox } from './HealthConditionsCombobox'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

export interface MedicalConditionsEditFormProps {
  userId: string
  currentConditions?: MedicalHistoryFormInput[]
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * MedicalConditionsEditForm - Manage personal medical conditions
 * User-friendly: Add/remove multiple conditions with details field
 */
export function MedicalConditionsEditForm({
  userId,
  currentConditions,
  onSuccess,
  inline = false,
  saveRef,
  onDirtyChange,
}: MedicalConditionsEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conditions, setConditions] = useState<Partial<MedicalHistoryFormInput>[]>(currentConditions || [])

  // Sync form state with parent props when modal opens
  // Note: inline mode uses useState initial value — we intentionally omit currentConditions
  // from deps to avoid resetting on every parent re-render (it's a new reference each time)
  useEffect(() => {
    if (isOpen) {
      setConditions(currentConditions || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(conditions) !== JSON.stringify(currentConditions || [])
  }, [conditions, currentConditions])

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    if (conditions.length === 0) {
      toast.error('Please add at least one medical condition or remove this section')
      return
    }

    setIsLoading(true)
    let saveErrorMessage: string | null = null

    try {
      const result = await updateMedicalConditions(userId, {
        conditions: conditions as MedicalHistoryFormInput[],
      })

      if (result.success) {
        toast.success(result.message || 'Medical conditions updated successfully')
        onSuccess?.()
        if (!inline) setIsOpen(false)
      } else {
        toast.error(result.error || 'An unexpected error occurred')
        saveErrorMessage = result.error || 'An unexpected error occurred'
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred. Please try again.'))
      throw err
    } finally {
      setIsLoading(false)
    }

    if (saveErrorMessage) throw new Error(saveErrorMessage)
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
    onDirtyChange?.(hasChanges)
  })

  const formContent = (
    <div className="space-y-6">
      {/* Health Conditions Multi-Select Combobox */}
      <HealthConditionsCombobox
        value={conditions.map((c) => ({
          conditionId: c.conditionId!,
          details: c.details,
        }))}
        onChange={(updatedConditions) => setConditions(updatedConditions as Partial<MedicalHistoryFormInput>[])}
        disabled={isLoading}
      />
    </div>
  )

  if (inline) {
    return (
      <div className="space-y-6">
        {formContent}
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Manage Conditions" />

      <FormModal
        isOpen={isOpen}
        title="Medical Conditions"
        description="Track your medical diagnoses and chronic conditions"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Conditions"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}