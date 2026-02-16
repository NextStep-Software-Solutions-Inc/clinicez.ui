'use client'

import React, { useState, useMemo } from 'react'
import { addVitalSign } from '@/actions/patient-profile'
import { vitalSignSchema, type VitalSignFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export interface VitalSignEditFormProps {
  userId: string
  currentData?: VitalSignFormInput
  onSuccess?: () => void
  inline?: boolean
}

/**
 * VitalSignEditForm - Record vital sign measurements
 * Medical focus: Clear measurement units, realistic validation ranges
 */
export function VitalSignEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
}: VitalSignEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<VitalSignFormInput>>(
    currentData || {}
  )

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(currentData || {})
  }, [formData, currentData])

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    if (!formData.dateTaken) {
      toast.error('Please select a date')
      return
    }

    setIsLoading(true)

    try {
      const result = await addVitalSign(userId, formData as VitalSignFormInput)

      if (result.success) {
        toast.success(result.message || 'Vital signs recorded successfully')
        if (!inline) setIsOpen(false)
        setFormData({})
        onSuccess?.()
      } else {
        toast.error(result.error || 'An unexpected error occurred')
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: keyof VitalSignFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }))
  }

  const formContent = (
    <>
      {/* Date & Basic */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Measurement Date</h3>

        <FormField label="Date Taken" required htmlFor="dateTaken">
          <Input
            id="dateTaken"
            type="date"
            value={formData.dateTaken ? new Date(formData.dateTaken).toISOString().split('T')[0] : ''}
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
        {formContent}

        <button
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Measurements'}
        </button>
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