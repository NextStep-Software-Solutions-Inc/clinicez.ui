'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { addVitalSign, updateVitalSign } from '@/actions/patient-profile'
import { vitalSignSchema, type VitalSignFormInput } from '@/schemas'
import type { VitalSign } from '@prisma/client'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

export interface VitalSignEditFormProps {
  userId: string
  currentData?: VitalSignFormInput
  recentVitals?: VitalSign[]
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * VitalSignEditForm - Record vital sign measurements
 * Medical focus: Clear measurement units, realistic validation ranges
 * Enhanced: Show recent measurements, allow editing or adding new
 */
export function VitalSignEditForm({
  userId,
  currentData,
  recentVitals = [],
  onSuccess,
  inline = false,
  saveRef,
  onDirtyChange,
}: VitalSignEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const [formData, setFormData] = useState<Partial<VitalSignFormInput> & { id?: number }>(
    currentData || {}
  )
  // Store baseline data to compare against (prevents auto-enable on refetch)
  const [baselineData, setBaselineData] = useState<Partial<VitalSignFormInput> & { id?: number }>(
    currentData || {}
  )

  // Sync form data when currentData prop changes (e.g., after successful save and refetch)
  useEffect(() => {
    if (currentData) {
      setFormData(currentData)
      setBaselineData(currentData)
      // Set to "Update Existing" mode if we have recent vitals
      setIsEditingExisting(true)
    } else {
      // If no currentData, clear the form only for non-inline mode
      if (!inline) {
        setFormData({})
        setBaselineData({})
        setIsEditingExisting(false)
      }
    }
  }, [currentData, inline])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    // Compare formData against baseline (both without id)
    const { id: _id, ...formDataWithoutId } = formData
    const { id: _id2, ...baselineWithoutId } = baselineData
    return JSON.stringify(formDataWithoutId) !== JSON.stringify(baselineWithoutId)
  }, [formData, baselineData])

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    if (!formData.dateTaken) {
      toast.error('Please select a date')
      return
    }

    const measurementFields: (keyof VitalSignFormInput)[] = [
      'height', 'weight', 'bpSystolic', 'bpDiastolic',
      'pulseRate', 'respRate', 'spo2', 'temp',
    ]
    const hasAnyMeasurement = measurementFields.some((f) => formData[f] !== undefined)
    if (!hasAnyMeasurement) {
      toast.error('Please enter at least one measurement before saving.')
      return
    }

    setIsLoading(true)
    let saveErrorMessage: string | null = null

    try {
      let result
      
      if (isEditingExisting && formData.id) {
        // Call update action for existing vital sign
        result = await updateVitalSign(userId, formData.id, formData as VitalSignFormInput)
      } else {
        // Call add action for new vital sign
        result = await addVitalSign(userId, formData as VitalSignFormInput)
      }

      if (result.success) {
        toast.success(result.message || 'Vital signs recorded successfully')
        // For modal mode, close the modal and clear form
        if (!inline) {
          setIsOpen(false)
          setFormData({})
          setBaselineData({})
        } else {
          // For inline mode (both create and update): clear form
          // This allows useEffect to sync fresh data from parent refetch
          // and prevents button from staying enabled after save
          setFormData({})
          setBaselineData({})
          setIsEditingExisting(false)
        }
        onSuccess?.()
      } else {
        toast.error(result.error || 'An unexpected error occurred')
        saveErrorMessage = result.error || 'An unexpected error occurred'
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred. Please try again.'))
      throw err
    } finally {
      setIsLoading(false)
    }

    if (saveErrorMessage) throw new Error(saveErrorMessage)
  }

  const handleFieldChange = (field: keyof VitalSignFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }))
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
    onDirtyChange?.(hasChanges)
  })

  const formContent = (
    <>
      {/* Date & Basic */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Measurement Date & Time</h3>

        <FormField label="Date & Time Taken" required htmlFor="dateTaken">
          <Input
            id="dateTaken"
            type="datetime-local"
            value={formData.dateTaken ? new Date(formData.dateTaken).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange('dateTaken', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </FormField>
      </div>

      {/* Anthropometric */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Measurements (Optional)</h3>

        <FormField label="Height (cm)" htmlFor="height" helpText="Range: 50-250 cm">
          <Input
            id="height"
            type="number"
            step="0.1"
            value={formData.height || ''}
            onChange={(e) => handleFieldChange('height', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 170"
          />
        </FormField>

        <FormField label="Weight (kg)" htmlFor="weight" helpText="Range: 1-500 kg">
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight || ''}
            onChange={(e) => handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 70"
          />
        </FormField>
      </div>

      {/* Blood Pressure */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Blood Pressure (Optional)</h3>

        <FormField label="Systolic (mmHg)" htmlFor="bpSystolic" helpText="Range: 40-250 mmHg">
          <Input
            id="bpSystolic"
            type="number"
            value={formData.bpSystolic || ''}
            onChange={(e) => handleFieldChange('bpSystolic', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 120"
          />
        </FormField>

        <FormField label="Diastolic (mmHg)" htmlFor="bpDiastolic" helpText="Range: 20-160 mmHg">
          <Input
            id="bpDiastolic"
            type="number"
            value={formData.bpDiastolic || ''}
            onChange={(e) => handleFieldChange('bpDiastolic', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 80"
          />
        </FormField>
      </div>

      {/* Cardiopulmonary */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Cardiopulmonary (Optional)</h3>

        <FormField label="Pulse Rate (bpm)" htmlFor="pulseRate" helpText="Normal: 60-100 bpm">
          <Input
            id="pulseRate"
            type="number"
            value={formData.pulseRate || ''}
            onChange={(e) => handleFieldChange('pulseRate', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 72"
          />
        </FormField>

        <FormField label="Respiration Rate (breaths/min)" htmlFor="respRate" helpText="Normal: 12-20">
          <Input
            id="respRate"
            type="number"
            value={formData.respRate || ''}
            onChange={(e) => handleFieldChange('respRate', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 16"
          />
        </FormField>

        <FormField label="Oxygen Saturation (%)" htmlFor="spo2" helpText="Normal: 95-100%">
          <Input
            id="spo2"
            type="number"
            step="0.1"
            value={formData.spo2 || ''}
            onChange={(e) => handleFieldChange('spo2', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 98"
          />
        </FormField>
      </div>

      {/* Temperature */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Temperature (Optional)</h3>

        <FormField label="Temperature (°C)" htmlFor="temp" helpText="Normal: 36.5-37.5°C">
          <Input
            id="temp"
            type="number"
            step="0.1"
            value={formData.temp || ''}
            onChange={(e) => handleFieldChange('temp', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 37"
          />
        </FormField>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold">Notes (Optional)</h3>
        <FormField label="Additional Notes" htmlFor="notes" helpText="Up to 500 characters">
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="e.g., Patient was anxious, measurements taken after rest"
            className="min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          />
        </FormField>
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="space-y-6">
        {/* Form Title & Action Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{isEditingExisting ? 'Update Last Measurement' : 'Add New Measurement'}</h3>
          
          {recentVitals && recentVitals.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const dataWithId = { ...recentVitals[0], id: recentVitals[0].id }
                  setFormData(dataWithId)
                  setBaselineData(dataWithId)
                  setIsEditingExisting(true)
                }}
                variant={isEditingExisting ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Update Existing
              </Button>
              <Button
                onClick={() => {
                  setFormData({})
                  setBaselineData({})
                  setIsEditingExisting(false)
                }}
                variant={!isEditingExisting ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
              >
                <Plus className="h-3 w-3" />
                Create New
              </Button>
            </div>
          )}
        </div>

        {formContent}
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Add Vital Sign" />

      <FormModal
        isOpen={isOpen}
        title="Record Vital Signs"
        description="Add your latest vital measurements"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Measurements"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}