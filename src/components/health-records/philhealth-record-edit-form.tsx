'use client'

import React, { useState, useMemo } from 'react'
import { updatePhilhealthRecord } from '@/actions/patient-profile'
import { philHealthRecordSchema, philHealthRecordLabels, philHealthMemberTypes, type PhilHealthRecordFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export interface PhilHealthRecordEditFormProps {
  userId: string
  currentData?: PhilHealthRecordFormInput
  onSuccess?: () => void
  inline?: boolean
}

/**
 * PhilHealthRecordEditForm - Manage PhilHealth insurance information
 * User-friendly: Clear field explanations, member type selection
 */
export function PhilHealthRecordEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
}: PhilHealthRecordEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PhilHealthRecordFormInput>>(
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

    if (!formData.pin) {
      toast.error('PhilHealth PIN is required')
      return
    }

    setIsLoading(true)

    try {
      const result = await updatePhilhealthRecord(userId, formData as PhilHealthRecordFormInput)

      if (result.success) {
        toast.success(result.message || 'PhilHealth record updated successfully')
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

  const handleFieldChange = (field: keyof PhilHealthRecordFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const formContent = (
    <>
      <FormModal
        isOpen={isOpen}
        title="PhilHealth Insurance Information"
        description="Update your PhilHealth coverage details"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save PhilHealth Info"
      >formContent

        {/* Required Information */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="text-sm font-semibold">Required Information</h3>

          <FormField label="PhilHealth ID Number (PIN)" required htmlFor="pin" helpText={philHealthRecordLabels.pin}>
            <Input
              id="pin"
              type="text"
              maxLength={50}
              value={formData.pin || ''}
              onChange={(e) => handleFieldChange('pin', e.target.value)}
              placeholder="e.g., 00-123456789-0"
            />
          </FormField>
        </div>

        {/* Member Type */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Member Category</h3>

          <FormField label="Member Type" htmlFor="memberTypeId" helpText={philHealthRecordLabels.memberTypeId}>
            <Select
              value={formData.memberTypeId ? formData.memberTypeId.toString() : ''}
              onValueChange={(value) => handleFieldChange('memberTypeId', value === '_empty' ? undefined : value ? parseInt(value) : null)}
            >
              <SelectTrigger id="memberTypeId">
                <SelectValue placeholder="Select your category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_empty">Not specified</SelectItem>
                {philHealthMemberTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Optional Information */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold">Additional Information (Optional)</h3>

          <FormField label="Tax Identification Number (TIN)" htmlFor="tin" helpText={philHealthRecordLabels.tin}>
            <Input
              id="tin"
              type="text"
              maxLength={50}
              value={formData.tin || ''}
              onChange={(e) => handleFieldChange('tin', e.target.value || null)}
              placeholder="e.g., 123-456-789-000"
            />
          </FormField>

          <FormField label="Philippine System ID (PhilSys)" htmlFor="philSysId" helpText={philHealthRecordLabels.philSysId}>
            <Input
              id="philSysId"
              type="text"
              maxLength={50}
              value={formData.philSysId || ''}
              onChange={(e) => handleFieldChange('philSysId', e.target.value || null)}
              placeholder="e.g., PS-1234567890-0"
            />
          </FormField>

          <FormField label="PhilHealth Card Photo URL" htmlFor="photoUrl" helpText={philHealthRecordLabels.photoUrl}>
            <Input
              id="photoUrl"
              type="url"
              value={formData.photoUrl || ''}
              onChange={(e) => handleFieldChange('photoUrl', e.target.value || null)}
              placeholder="https://example.com/philhealth-card.jpg"
            />
          </FormField>
        </div>
      </FormModal>
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
          {isLoading ? 'Saving...' : 'Save PhilHealth Info'}
        </button>
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit PhilHealth" />

      <FormModal
        isOpen={isOpen}
        title="PhilHealth Insurance Information"
        description="Update your PhilHealth coverage details"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save PhilHealth Info"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}