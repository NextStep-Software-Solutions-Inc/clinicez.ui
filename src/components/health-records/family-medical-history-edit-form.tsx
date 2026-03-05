'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updateFamilyMedicalConditions } from '@/actions/patient-profile'
import { familyMedicalHistorySchema, familyMedicalHistoryGuidance, type FamilyMedicalHistoryFormInput } from '@/schemas'
import { FormModal, EditButton } from './index'
import { HealthConditionsCombobox } from './HealthConditionsCombobox'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

export interface FamilyMedicalHistoryEditFormProps {
  userId: string
  currentConditions?: FamilyMedicalHistoryFormInput[]
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * FamilyMedicalHistoryEditForm - Track family medical conditions
 * User-friendly: Relationship tracking, genetic risk assessment
 */
export function FamilyMedicalHistoryEditForm({
  userId,
  currentConditions,
  onSuccess,
  inline = false,
  saveRef,
  onDirtyChange,
}: FamilyMedicalHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conditions, setConditions] = useState<Partial<FamilyMedicalHistoryFormInput>[]>(currentConditions || [])

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
      toast.error('Please add at least one family medical condition or remove this section')
      return
    }

    setIsLoading(true)
    let saveErrorMessage: string | null = null

    try {
      const result = await updateFamilyMedicalConditions(userId, {
        conditions: conditions as FamilyMedicalHistoryFormInput[],
      })

      if (result.success) {
        toast.success(result.message || 'Family medical history updated successfully')
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
        onChange={(updatedConditions) => setConditions(updatedConditions as Partial<FamilyMedicalHistoryFormInput>[])}
        disabled={isLoading}
      />

      {/* Family Relationship Tip */}
      {conditions.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-700 dark:text-blue-200">
            <strong>Tip:</strong> In the details field for each condition, specify the family relationship (e.g., "Father", "Maternal grandmother") and their age when diagnosed.
          </p>
        </div>
      )}
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
      <EditButton onClick={() => setIsOpen(true)} label="Edit Family History" />

      <FormModal
        isOpen={isOpen}
        title="Family Medical History"
        description="Track health conditions in your family members for genetic risk assessment"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Family History"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}
