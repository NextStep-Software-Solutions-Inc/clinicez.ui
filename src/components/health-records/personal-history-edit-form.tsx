'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updatePersonalHistory } from '@/actions/patient-profile'
import { personalHistorySchema, personalHistoryLabels, type PersonalHistoryFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

export interface PersonalHistoryEditFormProps {
  userId: string
  currentData?: PersonalHistoryFormInput
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * PersonalHistoryEditForm - Lifestyle and social history
 * User-friendly: Non-judgmental language, conditional field visibility
 */
export function PersonalHistoryEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
  saveRef,
  onDirtyChange,
}: PersonalHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PersonalHistoryFormInput>>(
    currentData || {}
  )

  // Update formData when currentData changes
  useEffect(() => {
    setFormData(currentData || {})
  }, [currentData])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(currentData || {})
  }, [formData, currentData])

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    setIsLoading(true)
    let saveErrorMessage: string | null = null

    try {
      const result = await updatePersonalHistory(userId, formData as PersonalHistoryFormInput)

      if (result.success) {
        toast.success(result.message || 'Personal history updated successfully')
        if (!inline) setIsOpen(false)
        setFormData(currentData || {})
        onSuccess?.()
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

  const handleFieldChange = (field: keyof PersonalHistoryFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
    onDirtyChange?.(hasChanges)
  })

  const formContent = (
    <div className="dark:text-gray-400 space-y-6">
      {/* Smoking History */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Smoking</h3>

        <FormField label="Smoking Status" htmlFor="smokingStatus" helpText="Select your current smoking status">
          <Select
            value={formData.smokingStatus || ''}
            onValueChange={(value) => handleFieldChange('smokingStatus', value || null)}
          >
            <SelectTrigger id="smokingStatus">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">Prefer not to answer</SelectItem>
              <SelectItem value="NEVER">{personalHistoryLabels.smokingStatus.NEVER}</SelectItem>
              <SelectItem value="FORMER">{personalHistoryLabels.smokingStatus.FORMER}</SelectItem>
              <SelectItem value="CURRENT">{personalHistoryLabels.smokingStatus.CURRENT}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Conditional: Show pack count for current/former smokers */}
        {(formData.smokingStatus === 'CURRENT' || formData.smokingStatus === 'FORMER') && (
          <FormField
            label="Packs per Year"
            htmlFor="numberOfPacksPerYear"
            helpText="Approximate number of cigarette packs per year"
          >
            <Input
              id="numberOfPacksPerYear"
              type="number"
              min="0"
              max="100"
              value={formData.numberOfPacksPerYear ?? ''}
              onChange={(e) => handleFieldChange('numberOfPacksPerYear', e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="e.g., 10"
            />
          </FormField>
        )}
      </div>

      {/* Alcohol History */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Alcohol Consumption</h3>

        <FormField label="Alcohol Status" htmlFor="alcoholStatus" helpText="Select your alcohol consumption pattern">
          <Select
            value={formData.alcoholStatus || ''}
            onValueChange={(value) => handleFieldChange('alcoholStatus', value)}
          >
            <SelectTrigger id="alcoholStatus">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">Prefer not to answer</SelectItem>
              <SelectItem value="NEVER">{personalHistoryLabels.alcoholStatus.NEVER}</SelectItem>
              <SelectItem value="OCCASIONAL">{personalHistoryLabels.alcoholStatus.OCCASIONAL}</SelectItem>
              <SelectItem value="REGULAR">{personalHistoryLabels.alcoholStatus.REGULAR}</SelectItem>
              <SelectItem value="HEAVY">{personalHistoryLabels.alcoholStatus.HEAVY}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Conditional: Show bottle count for active drinkers */}
        {formData.alcoholStatus && formData.alcoholStatus !== 'NEVER' && (
          <FormField
            label="Bottles per Day"
            htmlFor="numberOfBottlesPerDay"
            helpText="Average number of bottles/drinks per day"
          >
            <Input
              id="numberOfBottlesPerDay"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.numberOfBottlesPerDay ?? ''}
              onChange={(e) => handleFieldChange('numberOfBottlesPerDay', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 2"
            />
          </FormField>
        )}
      </div>

      {/* Drug Use */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Substance Use</h3>

        <FormField label="Illicit Drug Use" htmlFor="illicitDrugUse" helpText="History of non-prescription drug use">
          <Select
            value={formData.illicitDrugUse || ''}
            onValueChange={(value) => handleFieldChange('illicitDrugUse', value)}
          >
            <SelectTrigger id="illicitDrugUse">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">Prefer not to answer</SelectItem>
              <SelectItem value="NEVER">{personalHistoryLabels.illicitDrugUse.NEVER}</SelectItem>
              <SelectItem value="FORMER">{personalHistoryLabels.illicitDrugUse.FORMER}</SelectItem>
              <SelectItem value="CURRENT">{personalHistoryLabels.illicitDrugUse.CURRENT}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Sexual Activity */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold">Sexual History</h3>

        <FormField label="Sexual Activity Status" htmlFor="sexuallyActive" helpText="Current sexual activity status">
          <Select
            value={formData.sexuallyActive || ''}
            onValueChange={(value) => handleFieldChange('sexuallyActive', value)}
          >
            <SelectTrigger id="sexuallyActive">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">Prefer not to answer</SelectItem>
              <SelectItem value="YES">{personalHistoryLabels.sexuallyActive.YES}</SelectItem>
              <SelectItem value="NO">{personalHistoryLabels.sexuallyActive.NO}</SelectItem>
              <SelectItem value="INACTIVE">{personalHistoryLabels.sexuallyActive.INACTIVE}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
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
      <EditButton onClick={() => setIsOpen(true)} label="Edit History" />

      <FormModal
        isOpen={isOpen}
        title="Personal & Social History"
        description="Help us understand your lifestyle habits"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save History"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}
