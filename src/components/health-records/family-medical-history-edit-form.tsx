'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updateFamilyMedicalConditions } from '@/actions/patient-profile'
import { familyMedicalHistorySchema, familyMedicalHistoryGuidance, type FamilyMedicalHistoryFormInput } from '@/schemas'
import { FormModal, EditButton } from './index'
import { HealthConditionsCombobox } from './HealthConditionsCombobox'
import { toast } from 'sonner'

export interface FamilyMedicalHistoryEditFormProps {
  userId: string
  currentConditions?: FamilyMedicalHistoryFormInput[]
  onSuccess?: () => void
  inline?: boolean
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
}: FamilyMedicalHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conditions, setConditions] = useState<Partial<FamilyMedicalHistoryFormInput>[]>(currentConditions || [])

  // Sync form state with parent props when dialog opens or props change
  useEffect(() => {
    if (isOpen || inline) {
      console.log('[FamilyMedicalHistoryForm] Syncing conditions from prop:', currentConditions)
      setConditions(currentConditions || [])
    }
  }, [isOpen, currentConditions, inline])

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
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

        <button
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Family History'}
        </button>
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
