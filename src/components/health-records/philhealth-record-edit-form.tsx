'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updatePhilhealthRecord } from '@/actions/patient-profile'
import { addPhilHealthDependent, removePhilHealthDependent, updatePhilHealthDependent } from '@/actions/patient-profile/manage-philhealth-dependents'
import { uploadMediaAction } from '@/actions/blob.action'
import { philHealthRecordSchema, philHealthRecordLabels, philHealthMemberTypes, type PhilHealthRecordFormInput, type PhilHealthDependentFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

export interface PhilHealthRecordEditFormProps {
  userId: string
  currentData?: PhilHealthRecordFormInput & { id?: number; dependents?: any[] }
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * PhilHealthRecordEditForm - Manage PhilHealth insurance information and dependents
 * User-friendly: Clear field explanations, member type selection, dependent management
 */
export function PhilHealthRecordEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
  saveRef,
  onDirtyChange,
}: PhilHealthRecordEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState<Partial<PhilHealthRecordFormInput>>(
    currentData || {}
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentData?.photoUrl || null)
  const [dependents, setDependents] = useState<any[]>(currentData?.dependents || [])
  const [newDependent, setNewDependent] = useState<Partial<PhilHealthDependentFormInput>>({})
  const [isAddingDependent, setIsAddingDependent] = useState(false)
  const [isReplacingPhoto, setIsReplacingPhoto] = useState(false)

  // Sync form data when currentData changes
  useEffect(() => {
    if (currentData) {
      // Sync all form fields
      setFormData({
        pin: currentData.pin,
        tin: currentData.tin,
        philSysId: currentData.philSysId,
        memberTypeId: currentData.memberTypeId,
        photoUrl: currentData.photoUrl,
      })
      
      // Sync photo preview
      if (currentData.photoUrl) {
        setPhotoPreview(currentData.photoUrl)
      } else {
        setPhotoPreview(null)
      }
      
      // Sync dependents
      setDependents(currentData.dependents || [])
      setIsReplacingPhoto(false)
    }
  }, [currentData])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(formData) !== JSON.stringify(currentData || {}) ||
      JSON.stringify(dependents) !== JSON.stringify(currentData?.dependents || [])
    )
  }, [formData, dependents, currentData])

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
    let saveErrorMessage: string | null = null

    try {
      const result = await updatePhilhealthRecord(userId, formData as PhilHealthRecordFormInput)

      if (result.success) {
        toast.success(result.message || 'PhilHealth record updated successfully')
        if (!inline) setIsOpen(false)
        setFormData({})
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

  const handleFieldChange = (field: keyof PhilHealthRecordFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleAddDependent = async () => {
    if (!newDependent.firstName) {
      toast.error('First name is required for dependent')
      return
    }

    if (!currentData?.id) {
      toast.error('Save your PhilHealth information first', {
        description: 'Please fill in your PIN and save your PhilHealth record before adding dependents.',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await addPhilHealthDependent(
        userId,
        currentData.id,
        newDependent as PhilHealthDependentFormInput
      )

      if (result.success) {
        toast.success('Dependent added successfully')
        setDependents([...dependents, result.dependent])
        setNewDependent({})
        setIsAddingDependent(false)
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to add dependent')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDependent = async (dependentId: number, name: string) => {
    if (!confirm(`Remove ${name} as dependent?`)) return

    setIsLoading(true)

    try {
      const result = await removePhilHealthDependent(userId, dependentId)

      if (result.success) {
        toast.success(result.message)
        setDependents(dependents.filter((d) => d.id !== dependentId))
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to remove dependent')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDependentFieldChange = (field: keyof PhilHealthDependentFormInput, value: any) => {
    setNewDependent((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploadingPhoto(true)

    try {
      // Create FormData for upload
      const formDataToUpload = new FormData()
      formDataToUpload.append('media', file)
      formDataToUpload.append('directory', `user-${userId}/philhealth-photos`)

      // Upload file
      const result = await uploadMediaAction(formDataToUpload)

      if (!result?.url || result.url === '') {
        toast.error('Upload failed: No URL returned from server')
        return
      }

      // Set the photoUrl in form data
      setFormData((prev) => ({
        ...prev,
        photoUrl: result.url,
      }))
      // Set preview
      setPhotoPreview(result.url)
      toast.success('Photo uploaded successfully')
    } catch (error) {
      console.error('[PHOTO_UPLOAD_ERROR]', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to upload photo: ${errorMessage}`)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
    onDirtyChange?.(hasChanges)
  })

  const formContent = (
    <div className="space-y-6 dark:text-gray-400">
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
            value={formData.memberTypeId?.toString() || ''}
            onValueChange={(value) => handleFieldChange('memberTypeId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select member type" />
            </SelectTrigger>
            <SelectContent>
              {philHealthMemberTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name} - {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Optional Information */}
      <div className="space-y-4 border-b py-4 dark:text-gray-400">
        <h3 className="text-sm font-semibold">Additional Information</h3>

        <FormField label="TIN (Tax Identification Number)" htmlFor="tin" helpText={philHealthRecordLabels.tin}>
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

        <FormField label="PhilHealth Card Photo" htmlFor="photoFile" helpText={philHealthRecordLabels.photoUrl}>
          <div className="space-y-4">
            {/* Current Photo Display */}
            {photoPreview && !isReplacingPhoto && (
              <div className="space-y-3">
                <div className="relative w-full">
                  <div className="relative inline-block w-full max-w-sm">
                    <img
                      src={photoPreview}
                      alt="PhilHealth Card Preview"
                      className="w-full h-64 object-cover rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-xl rings-2 ring-blue-300 dark:ring-blue-600"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsReplacingPhoto(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Replace Photo
                  </Button>
                  <Button
                    onClick={() => {
                      setPhotoPreview(null)
                      setFormData((prev) => ({
                        ...prev,
                        photoUrl: null,
                      }))
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Section - Show when no photo or replacing */}
            {(!photoPreview || isReplacingPhoto) && (
              <div className="space-y-3 p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/30 dark:bg-blue-950/10">
                {isReplacingPhoto && photoPreview && (
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Replace current photo?</p>
                    <Button
                      onClick={() => setIsReplacingPhoto(false)}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isReplacingPhoto ? 'Upload a new photo to replace the current one' : 'Upload your PhilHealth card photo'}
                </p>

                {/* File Upload Input */}
                <div className="flex items-center gap-3">
                  <input
                    id="photoFile"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm file:mr-2 file:py-1 file:px-3 file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:file:bg-blue-600"
                  />
                  {isUploadingPhoto && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                </div>

                {/* Manual URL Input Alternative */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Or paste an image URL:</p>
                  <Input
                    type="url"
                    value={formData.photoUrl || ''}
                    onChange={(e) => {
                      const url = e.target.value || null
                      setFormData((prev) => ({
                        ...prev,
                        photoUrl: url,
                      }))
                      if (url) {
                        setPhotoPreview(url)
                        setIsReplacingPhoto(false)
                      }
                    }}
                    placeholder="https://example.com/philhealth-card.jpg"
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </FormField>
      </div>

      {/* Dependents Section */}
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Dependents</h3>
          <Button
            onClick={() => {
              if (!currentData?.id) {
                toast.error('Save your PhilHealth information first', {
                  description: 'Please fill in your PIN and save your PhilHealth record before adding dependents.',
                })
                return
              }
              setIsAddingDependent(!isAddingDependent)
            }}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={!currentData?.id && !isAddingDependent}
          >
            {isAddingDependent ? 'Cancel' : '+ Add Dependent'}
          </Button>
        </div>

        {/* Instructions if no PhilHealth record yet */}
        {!currentData?.id && dependents.length === 0 && !isAddingDependent && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
            <p className="font-medium text-blue-900 dark:text-blue-100">Save your PhilHealth record first</p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              You can add family members as dependents after saving your PhilHealth PIN and member information.
            </p>
          </div>
        )}

        {/* Current Dependents List */}
        {dependents.length > 0 && (
          <div className="space-y-2">
            {dependents.map((dependent) => (
              <div key={dependent.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex-1">
                  <p className="font-medium">
                    {dependent.firstName} {dependent.middleName ? dependent.middleName + ' ' : ''}
                    {dependent.lastName || ''}
                  </p>
                  {dependent.relationship && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{dependent.relationship}</p>
                  )}
                </div>
                <Button
                  onClick={() => handleRemoveDependent(dependent.id, dependent.firstName)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Dependent Form */}
        {isAddingDependent && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <h4 className="text-xs font-semibold">Add New Dependent</h4>

            <FormField label="First Name" required htmlFor="dep-firstName">
              <Input
                id="dep-firstName"
                type="text"
                value={newDependent.firstName || ''}
                onChange={(e) => handleDependentFieldChange('firstName', e.target.value)}
                placeholder="e.g., Maria"
                className="text-sm"
              />
            </FormField>

            <FormField label="Middle Name" htmlFor="dep-middleName">
              <Input
                id="dep-middleName"
                type="text"
                value={newDependent.middleName || ''}
                onChange={(e) => handleDependentFieldChange('middleName', e.target.value || null)}
                placeholder="e.g., Santos"
                className="text-sm"
              />
            </FormField>

            <FormField label="Last Name" htmlFor="dep-lastName">
              <Input
                id="dep-lastName"
                type="text"
                value={newDependent.lastName || ''}
                onChange={(e) => handleDependentFieldChange('lastName', e.target.value || null)}
                placeholder="e.g., Garcia"
                className="text-sm"
              />
            </FormField>

            <FormField label="Relationship" htmlFor="dep-relationship">
              <Input
                id="dep-relationship"
                type="text"
                value={newDependent.relationship || ''}
                onChange={(e) => handleDependentFieldChange('relationship', e.target.value || null)}
                placeholder="e.g., Spouse, Child, Parent"
                className="text-sm"
              />
            </FormField>

            <FormField label="Date of Birth" htmlFor="dep-dob">
              <Input
                id="dep-dob"
                type="date"
                value={newDependent.dob ? new Date(newDependent.dob).toISOString().split('T')[0] : ''}
                onChange={(e) => handleDependentFieldChange('dob', e.target.value ? new Date(e.target.value) : null)}
                className="text-sm"
              />
            </FormField>

            <div className="flex gap-2">
              <Button
                onClick={handleAddDependent}
                disabled={isLoading}
                size="sm"
                className="flex-1 text-xs"
              >
                {isLoading ? 'Adding...' : 'Add Dependent'}
              </Button>
              <Button
                onClick={() => {
                  setIsAddingDependent(false)
                  setNewDependent({})
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {dependents.length === 0 && !isAddingDependent && currentData?.id && (
          <p className="text-xs text-gray-500 dark:text-gray-400">No dependents added yet</p>
        )}
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
      <EditButton onClick={() => setIsOpen(true)} label="Edit PhilHealth" />

      <FormModal
        isOpen={isOpen}
        title="PhilHealth Insurance Information"
        description="Update your PhilHealth coverage details and dependents"
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
