'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { addPhysicalExamination } from '@/actions/patient-profile'
import { physicalExaminationSchema, type PhysicalExaminationFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export interface PhysicalExaminationEditFormProps {
  userId: string
  currentData?: PhysicalExaminationFormInput
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
}

/**
 * PhysicalExaminationEditForm - Record physical examination findings
 * User-friendly: Clear vision format guidance, status documentation
 */
export function PhysicalExaminationEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
  saveRef,
}: PhysicalExaminationEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PhysicalExaminationFormInput>>(
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

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    setIsLoading(true)

    try {
      console.log('[PhysicalExamForm] Submitting:', formData)
      const result = await addPhysicalExamination(userId, formData as PhysicalExaminationFormInput)
      console.log('[PhysicalExamForm] Save result:', result)

      if (result.success) {
        console.log('[PhysicalExamForm] Save successful')
        toast.success(result.message || 'Physical examination recorded successfully')
        if (!inline) setIsOpen(false)
        setFormData({})
        await onSuccess?.()
        console.log('[PhysicalExamForm] After onSuccess, waiting for data sync')
      } else {
        toast.error(result.error || 'An unexpected error occurred')
      }
    } catch (err) {
      console.error('[PhysicalExamForm] Error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: keyof PhysicalExaminationFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
  })

  const formContent = (
    <>
      {/* Visual Acuity */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="text-sm font-semibold">Visual Acuity (Optional)</h3>

          <FormField
            label="Visual Acuity - Left Eye"
            htmlFor="visualAcuityLeft"
            helpText="Format: 20/20 or 6/6 (e.g., 20/20, 20/40, 6/6, 6/12)"
          >
            <Input
              id="visualAcuityLeft"
              type="text"
              placeholder="e.g., 20/20"
              value={formData.visualAcuityLeft || ''}
              onChange={(e) => handleFieldChange('visualAcuityLeft', e.target.value || null)}
              pattern="^\d+\/\d+$"
            />
          </FormField>

          <FormField
            label="Visual Acuity - Right Eye"
            htmlFor="visualAcuityRight"
            helpText="Format: 20/20 or 6/6 (e.g., 20/20, 20/40, 6/6, 6/12)"
          >
            <Input
              id="visualAcuityRight"
              type="text"
              placeholder="e.g., 20/20"
              value={formData.visualAcuityRight || ''}
              onChange={(e) => handleFieldChange('visualAcuityRight', e.target.value || null)}
              pattern="^\d+\/\d+$"
            />
          </FormField>
        </div>

        {/* Examination Findings */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold">Examination Findings (Optional)</h3>

          <FormField
            label="Examination Status"
            htmlFor="status"
            helpText="Document any abnormal findings or notes (up to 200 characters)"
          >
            <textarea
              id="status"
              value={formData.status || ''}
              onChange={(e) => handleFieldChange('status', e.target.value || null)}
              maxLength={200}
              placeholder="e.g., Normal examination, no abnormalities detected"
              className="min-h-16 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
          </FormField>
        </div>
    </>
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
      <EditButton onClick={() => setIsOpen(true)} label="Record Examination" />

      <FormModal
        isOpen={isOpen}
        title="Physical Examination"
        description="Document physical examination findings"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Examination"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}