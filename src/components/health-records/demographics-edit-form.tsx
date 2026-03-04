'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { updateDemographics } from '@/actions/patient-profile'
import { demographicsSchema, type DemographicsFormInput } from '@/schemas'
import { FormModal, FormField, EditButton, ProfilePictureUpload } from './index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatBloodType } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'

const BLOOD_TYPES = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'RH_POSITIVE',
  'RH_NEGATIVE',
  'UNKNOWN',
]

const GENDERS = ['MALE', 'FEMALE']
const CIVIL_STATUS = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']

export interface DemographicsEditFormProps {
  userId: string
  currentData?: DemographicsFormInput
  currentPicture?: string | null
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
}

/**
 * DemographicsEditForm - Edit user profile information
 * User-centric: Organized field groups, clear validation, helpful messages
 */
export function DemographicsEditForm({
  userId,
  currentData,
  currentPicture,
  onSuccess,
  inline = false,
  saveRef,
}: DemographicsEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<DemographicsFormInput>>(
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

    setIsLoading(true)

    try {
      const result = await updateDemographics(userId, formData as DemographicsFormInput)

      if (result.success) {
        toast.success(result.message || 'Demographic information updated successfully')
        if (!inline) setIsOpen(false)
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

  const handleFieldChange = (field: keyof DemographicsFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  // Expose submit handler to parent via saveRef (no deps — always keeps ref current with latest closure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saveRef) saveRef.current = { submit: handleSubmit, hasChanges }
  })

  const formContent = (
    <>
        {/* Profile Picture */}
        <div className="space-y-5 border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
            Profile Picture
          </h3>
          <ProfilePictureUpload
            userId={userId}
            currentPicture={currentPicture}
            onSuccess={() => onSuccess?.()}
          />
        </div>

        {/* Basic Information */}
        <div className="space-y-5 border-b border-slate-200 dark:border-slate-700 py-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Basic Information
          </h3>

          <FormField label="First Name" required htmlFor="firstName">
            <Input
              id="firstName"
              value={formData.firstName || ''}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              placeholder="Enter first name"
            />
          </FormField>

          <FormField label="Middle Name" htmlFor="middleName">
            <Input
              id="middleName"
              value={formData.middleName || ''}
              onChange={(e) => handleFieldChange('middleName', e.target.value)}
              placeholder="Enter middle name (optional)"
            />
          </FormField>

          <FormField label="Last Name" required htmlFor="lastName">
            <Input
              id="lastName"
              value={formData.lastName || ''}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              placeholder="Enter last name"
            />
          </FormField>

          <FormField label="Suffix" htmlFor="suffix">
            <Input
              id="suffix"
              value={formData.suffix || ''}
              onChange={(e) => handleFieldChange('suffix', e.target.value)}
              placeholder="e.g., Jr., Sr., III"
            />
          </FormField>

          <FormField label="Nickname" htmlFor="nickname">
            <Input
              id="nickname"
              value={formData.nickname || ''}
              onChange={(e) => handleFieldChange('nickname', e.target.value)}
              placeholder="What do people call you?"
            />
          </FormField>
        </div>

        {/* Medical Information */}
        <div className="space-y-5 border-b border-slate-200 dark:border-slate-700 py-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Medical Information
          </h3>

          <FormField label="Date of Birth" htmlFor="dob">
            <Input
              id="dob"
              type="date"
              value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFieldChange('dob', e.target.value ? new Date(e.target.value) : undefined)}
            />
          </FormField>

          <FormField label="Gender">
            <RadioGroup value={formData.gender || ''} onValueChange={(value) => handleFieldChange('gender', value)}>
              <div className="flex items-center gap-6">
                {GENDERS.map((g) => (
                  <div key={g} className="flex items-center gap-2">
                    <RadioGroupItem value={g} id={g} />
                    <label htmlFor={g} className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>

          <FormField label="Blood Type">
            <RadioGroup value={formData.bloodType || ''} onValueChange={(value) => handleFieldChange('bloodType', value)}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {BLOOD_TYPES.map((bt) => (
                  <div key={bt} className="flex items-center gap-2">
                    <RadioGroupItem value={bt} id={bt} />
                    <label htmlFor={bt} className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      {formatBloodType(bt)}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>
        </div>

        {/* Social Information */}
        <div className="space-y-5 border-b border-slate-200 dark:border-slate-700 py-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Social Information
          </h3>

          <FormField label="Civil Status">
            <RadioGroup value={formData.civilStatus || ''} onValueChange={(value) => handleFieldChange('civilStatus', value)}>
              <div className="flex flex-wrap gap-4">
                {CIVIL_STATUS.map((cs) => (
                  <div key={cs} className="flex items-center gap-2">
                    <RadioGroupItem value={cs} id={cs} />
                    <label htmlFor={cs} className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      {cs.charAt(0) + cs.slice(1).toLowerCase()}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>

          <FormField label="Religion" htmlFor="religion">
            <Input
              id="religion"
              value={formData.religion || ''}
              onChange={(e) => handleFieldChange('religion', e.target.value)}
              placeholder="e.g., Catholic, Protestant, Muslim, etc."
            />
          </FormField>

          <FormField label="Nationality" htmlFor="nationality">
            <Input
              id="nationality"
              value={formData.nationality || ''}
              onChange={(e) => handleFieldChange('nationality', e.target.value)}
              placeholder="Enter nationality"
            />
          </FormField>

          <FormField label="Place of Birth" htmlFor="placeOfBirth">
            <Input
              id="placeOfBirth"
              value={formData.placeOfBirth || ''}
              onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
              placeholder="e.g., Manila, Philippines"
            />
          </FormField>
        </div>

        {/* Contact Information */}
        <div className="space-y-5 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Contact Information
          </h3>

          <FormField label="Mobile Number" htmlFor="mobile">
            <Input
              id="mobile"
              value={formData.mobile || ''}
              onChange={(e) => handleFieldChange('mobile', e.target.value)}
              placeholder="+63 900 123 4567"
            />
          </FormField>

          <FormField label="Telephone" htmlFor="telephone">
            <Input
              id="telephone"
              value={formData.telephone || ''}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
              placeholder="+63 2 1234 5678"
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit Profile" />

      <FormModal
        isOpen={isOpen}
        title="Edit Demographic Information"
        description="Update your personal and contact information"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Changes"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}
