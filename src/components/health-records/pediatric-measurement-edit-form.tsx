'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { addPediatricMeasurement } from '@/actions/patient-profile'
import { pediatricMeasurementSchema, evaluateMUAC, type PediatricMeasurementFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export interface PediatricMeasurementEditFormProps {
  userId: string
  currentData?: PediatricMeasurementFormInput
  onSuccess?: () => void
  inline?: boolean
}

/**
 * PediatricMeasurementEditForm - Pediatric growth and development measurements
 * User-friendly: Clear measurement groups, nutritional status interpretation
 */
export function PediatricMeasurementEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
}: PediatricMeasurementEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PediatricMeasurementFormInput>>(
    currentData || {}
  )

  // Sync form data when currentData prop changes (e.g., after successful save and refetch)
  useEffect(() => {
    if (currentData) {
      setFormData(currentData)
    }
  }, [currentData])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(currentData || {})
  }, [formData, currentData])

  const muacStatus = evaluateMUAC(formData.midUpperArmCircumference)

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
      console.log('[PediatricForm] Submitting:', formData)
      const result = await addPediatricMeasurement(userId, formData as PediatricMeasurementFormInput)
      console.log('[PediatricForm] Save result:', result)

      if (result.success) {
        console.log('[PediatricForm] Save successful, measurement ID:', result.measurementId)
        toast.success('Measurement recorded successfully')
        // For modal mode, close the modal and clear form
        if (!inline) {
          setIsOpen(false)
          setFormData({})
        }
        // For inline mode, let parent refetch and useEffect will sync new data
        // Don't clear formData here - wait for useEffect to sync with fresh data
        await onSuccess?.()
        console.log('[PediatricForm] After onSuccess, waiting for data sync')
      } else {
        toast.error(result.error || 'An unexpected error occurred')
      }
    } catch (err) {
      console.error('[PediatricForm] Error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: keyof PediatricMeasurementFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const formContent = (
    <>
      {/* Date */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Measurement Date</h3>

        <FormField label="Date Taken" required htmlFor="dateTaken">
          <Input
            id="dateTaken"
            type="date"
            value={formData.dateTaken ? new Date(formData.dateTaken).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('dateTaken', e.target.value ? new Date(e.target.value) : null)}
          />
        </FormField>
      </div>

        {/* Linear Measurements */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Linear Measurements</h3>

          <FormField label="Length (cm)" htmlFor="length" helpText="Measurement from head to toes (typically 20-150 cm)">
            <Input
              id="length"
              type="number"
              step="0.1"
              min="20"
              max="150"
              value={formData.length || ''}
              onChange={(e) => handleFieldChange('length', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 85"
            />
          </FormField>

          <FormField label="Head Circumference (cm)" htmlFor="headCircumference" helpText="Head circumference (typically 20-60 cm)">
            <Input
              id="headCircumference"
              type="number"
              step="0.1"
              min="20"
              max="60"
              value={formData.headCircumference || ''}
              onChange={(e) => handleFieldChange('headCircumference', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 48"
            />
          </FormField>
        </div>

        {/* Body Circumferences */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Body Circumferences</h3>

          <FormField label="Waist Circumference (cm)" htmlFor="waistCircumference" helpText="Measured at narrowest point (typically 10-150 cm)">
            <Input
              id="waistCircumference"
              type="number"
              step="0.1"
              min="10"
              max="150"
              value={formData.waistCircumference || ''}
              onChange={(e) => handleFieldChange('waistCircumference', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 55"
            />
          </FormField>

          <FormField label="Hip Circumference (cm)" htmlFor="hipCircumference" helpText="Measured at widest point (typically 10-150 cm)">
            <Input
              id="hipCircumference"
              type="number"
              step="0.1"
              min="10"
              max="150"
              value={formData.hipCircumference || ''}
              onChange={(e) => handleFieldChange('hipCircumference', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 65"
            />
          </FormField>

          <FormField label="Limb Circumference (cm)" htmlFor="limbCircumference" helpText="Upper arm or leg measurement (typically 5-40 cm)">
            <Input
              id="limbCircumference"
              type="number"
              step="0.1"
              min="5"
              max="40"
              value={formData.limbCircumference || ''}
              onChange={(e) => handleFieldChange('limbCircumference', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 18"
            />
          </FormField>

          <FormField label="Mid-Upper Arm Circumference (cm)" htmlFor="midUpperArmCircumference" helpText="MUAC - important nutritional indicator">
            <Input
              id="midUpperArmCircumference"
              type="number"
              step="0.1"
              min="10"
              max="50"
              value={formData.midUpperArmCircumference || ''}
              onChange={(e) => handleFieldChange('midUpperArmCircumference', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 15"
            />
            {muacStatus && (
              <Alert className="mt-2">
                <AlertDescription>
                  <strong>Nutritional Status:</strong> {muacStatus}
                </AlertDescription>
              </Alert>
            )}
          </FormField>
        </div>

        {/* Tissue Measurements */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Tissue Measurements</h3>

          <FormField label="Skinfold Thickness (mm)" htmlFor="skinfoldThickness" helpText="Triceps or other site (typically 0-40 mm)">
            <Input
              id="skinfoldThickness"
              type="number"
              step="0.1"
              min="0"
              max="40"
              value={formData.skinfoldThickness || ''}
              onChange={(e) => handleFieldChange('skinfoldThickness', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 8"
            />
          </FormField>
        </div>

        {/* Notes */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold">Additional Notes</h3>
          <FormField label="Remarks" htmlFor="remarks" helpText="Up to 500 characters">
            <textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleFieldChange('remarks', e.target.value || null)}
              placeholder="e.g., Measurements taken standing, barefoot"
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
      <EditButton onClick={() => setIsOpen(true)} label="Record Measurements" />

      <FormModal
        isOpen={isOpen}
        title="Pediatric Growth Measurements"
        description="Record your child's growth and development measurements"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Measurements"
        size="lg"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}