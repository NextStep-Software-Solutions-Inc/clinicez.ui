'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updatePhilhealthRecord } from '@/actions/patient-profile'
import { addPhilHealthDependent, removePhilHealthDependent, updatePhilHealthDependent } from '@/actions/patient-profile/manage-philhealth-dependents'
import { uploadMediaAction } from '@/actions/blob.action'
import { philHealthRecordSchema, philHealthRecordLabels, type PhilHealthRecordFormInput, type PhilHealthDependentFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { getPrincipalMemberByPinAction, type PrincipalMemberInfo } from '@/actions/clinics/konsulta-report.action'
import { X, Upload, Loader2, ShieldCheck } from 'lucide-react'

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
  const [principalInfo, setPrincipalInfo] = useState<PrincipalMemberInfo | null>(null)

  // Lookup principal member info when memberType is Dependent and pin is entered
  useEffect(() => {
    if (formData.memberType === 'DD' && formData.pin?.trim()) {
      void getPrincipalMemberByPinAction(formData.pin.trim()).then((res) => {
        if (res.data) {
          setPrincipalInfo(res.data)
        } else {
          setPrincipalInfo(null)
        }
      })
    } else {
      setPrincipalInfo(null)
    }
  }, [formData.memberType, formData.pin])

  // Sync form data when currentData changes
  useEffect(() => {
    if (currentData) {
      // Sync all form fields
      setFormData({
        pin: currentData.pin,
        dependentPin: currentData.dependentPin,
        tin: currentData.tin,
        philSysId: currentData.philSysId,
        memberType: currentData.memberType || 'MM',
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
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
    onDirtyChange?.(hasChanges)
  })

  const formatPhilHealthPIN = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += '-' + digits.substring(2, 11);
    }
    if (digits.length > 11) {
      formatted += '-' + digits.substring(11, 12);
    }
    return formatted;
  }

  const formatTIN = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 3);
    }
    if (digits.length > 3) {
      formatted += '-' + digits.substring(3, 6);
    }
    if (digits.length > 6) {
      formatted += '-' + digits.substring(6, 9);
    }
    if (digits.length > 9) {
      formatted += '-' + digits.substring(9, 12);
    }
    return formatted;
  }

  const formatPhilSysID = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 4);
    }
    if (digits.length > 4) {
      formatted += ' ' + digits.substring(4, 8);
    }
    if (digits.length > 8) {
      formatted += ' ' + digits.substring(8, 12);
    }
    return formatted;
  }

  const handleFieldChange = (field: keyof PhilHealthRecordFormInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formContent = (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pb-8">
      {/* Required Information */}
      <div className="space-y-4 border-b py-4">
        <h3 className="text-sm font-semibold">Primary Information</h3>
        
        <div className="space-y-2">
          <Label>Member Category</Label>
          <RadioGroup 
            value={formData.memberType || 'MM'} 
            onValueChange={(v) => handleFieldChange('memberType', v)}
            className="flex items-center gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MM" id="member-mm" />
              <Label htmlFor="member-mm">Principal Member</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DD" id="member-dd" />
              <Label htmlFor="member-dd">Dependent</Label>
            </div>
          </RadioGroup>
        </div>

        <FormField label={formData.memberType === 'DD' ? "Principal Member PIN" : "Your PhilHealth PIN"} htmlFor="pin" helpText={philHealthRecordLabels.pin}>
          <Input
            id="pin"
            value={formData.pin || ''}
            onChange={(e) => handleFieldChange('pin', formatPhilHealthPIN(e.target.value))}
            placeholder="00-000000000-0"
            maxLength={14}
            className="font-mono"
            required
          />
        </FormField>

        {formData.memberType === 'DD' && (
          <div className="space-y-3">
            {principalInfo && (
              <div className="border border-primary/20 bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Principal Member Info (Read-Only)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">PIN:</span>{" "}
                    <span className="font-mono text-foreground font-semibold">{principalInfo.pin}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Date of Birth:</span>{" "}
                    <span>{principalInfo.dob}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">First Name:</span>{" "}
                    <span>{principalInfo.firstName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Last Name:</span>{" "}
                    <span>{principalInfo.lastName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Middle Name:</span>{" "}
                    <span>{principalInfo.middleName || "—"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Ext Name:</span>{" "}
                    <span>{principalInfo.extensionName || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            <FormField label="Your Dependent PIN (Optional)" htmlFor="dependentPin" helpText={philHealthRecordLabels.dependentPin}>
              <Input
                id="dependentPin"
                value={formData.dependentPin || ''}
                onChange={(e) => handleFieldChange('dependentPin', formatPhilHealthPIN(e.target.value))}
                placeholder="00-000000000-0"
                maxLength={14}
                className="font-mono"
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Optional Information */}
      <div className="space-y-4 border-b py-4 dark:text-gray-400">
        <h3 className="text-sm font-semibold">Additional Information</h3>

        <FormField label="TIN (Tax Identification Number)" htmlFor="tin" helpText={philHealthRecordLabels.tin}>
          <Input
            id="tin"
            type="text"
            maxLength={15}
            value={formData.tin || ''}
            onChange={(e) => handleFieldChange('tin', formatTIN(e.target.value) || null)}
            placeholder="000-000-000-000"
            className="font-mono"
          />
        </FormField>

        <FormField label="Philippine System ID (PhilSys)" htmlFor="philSysId" helpText={philHealthRecordLabels.philSysId}>
          <Input
            id="philSysId"
            type="text"
            maxLength={14}
            value={formData.philSysId || ''}
            onChange={(e) => handleFieldChange('philSysId', formatPhilSysID(e.target.value) || null)}
            placeholder="0000 0000 0000"
            className="font-mono"
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
