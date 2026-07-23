'use client'

import React, { useState, useEffect } from 'react'
import { updateDemographics } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { demographicsSchema, type DemographicsFormInput } from '@/schemas/demographics-schema'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export interface DemographicsInlineFormProps {
  userId: string
  currentData?: Partial<DemographicsFormInput>
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function DemographicsInlineForm({
  userId,
  currentData = {},
  onSuccess,
  saveRef,
  onDirtyChange,
}: DemographicsInlineFormProps) {
  const [formData, setFormData] = useState<Partial<DemographicsFormInput>>(currentData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Track changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(currentData)

  useEffect(() => {
    onDirtyChange?.(hasChanges)
  }, [hasChanges, onDirtyChange])

  const handleFieldChange = (field: keyof DemographicsFormInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
    // Clear error for the field being edited
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    // Validation using zod schema
    const validationResult = demographicsSchema.safeParse({
      ...formData,
      // Map empty values to null/undefined where appropriate
      middleName: formData.middleName || null,
      suffix: formData.suffix || null,
      nickname: formData.nickname || null,
      dob: formData.dob ? new Date(formData.dob) : null,
      mobile: formData.mobile || null,
      telephone: formData.telephone || null,
      placeOfBirth: formData.placeOfBirth || null,
      nationality: formData.nationality || null,
      religion: formData.religion || null,
    })

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error('Validation failed. Please check form errors.')
      throw new Error('Validation failed')
    }

    let saveErrorMessage: string | null = null

    try {
      const result = await updateDemographics(userId, validationResult.data as DemographicsFormInput)

      if (result.success) {
        toast.success(result.message || 'Demographic information updated successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'An unexpected error occurred')
        saveErrorMessage = result.error || 'An unexpected error occurred'
      }
    } catch (err) {
      const errMsg = getActionErrorMessage(err, 'An unexpected error occurred. Please try again.')
      toast.error(errMsg)
      throw err
    }

    if (saveErrorMessage) throw new Error(saveErrorMessage)
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = { submit: handleSubmit, hasChanges }
    }
    return () => {
      if (saveRef) saveRef.current = null
    }
  }, [saveRef, formData, hasChanges])

  const renderField = (
    label: string,
    field: keyof DemographicsFormInput | 'email',
    control: React.ReactNode
  ) => {
    const error = field === 'email' ? undefined : errors[field as keyof DemographicsFormInput]
    return (
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">{control}</div>
        {error && (
          <span className="text-xs text-red-500 font-medium block mt-1">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
      {renderField(
        'First Name',
        'firstName',
        <Input
          value={formData.firstName || ''}
          onChange={(e) => handleFieldChange('firstName', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="First Name"
        />
      )}

      {renderField(
        'Middle Name',
        'middleName',
        <Input
          value={formData.middleName || ''}
          onChange={(e) => handleFieldChange('middleName', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Middle Name"
        />
      )}

      {renderField(
        'Last Name',
        'lastName',
        <Input
          value={formData.lastName || ''}
          onChange={(e) => handleFieldChange('lastName', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Last Name"
        />
      )}

      {renderField(
        'Suffix',
        'suffix',
        <Input
          value={formData.suffix || ''}
          onChange={(e) => handleFieldChange('suffix', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="e.g. Jr., Sr., III"
        />
      )}

      {renderField(
        'Nickname',
        'nickname',
        <Input
          value={formData.nickname || ''}
          onChange={(e) => handleFieldChange('nickname', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Nickname"
        />
      )}

      {renderField(
        'Date of Birth',
        'dob',
        <Input
          type="date"
          value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
          onChange={(e) => handleFieldChange('dob', e.target.value ? new Date(e.target.value) : null)}
          className="h-9 text-sm focus-visible:ring-teal-500"
        />
      )}

      {renderField(
        'Gender',
        'gender',
        <Select
          value={formData.gender || ''}
          onValueChange={(val) => handleFieldChange('gender', val || null)}
        >
          <SelectTrigger className="h-9 text-sm focus:ring-teal-500">
            <SelectValue placeholder="Select Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
      )}

      {renderField(
        'Blood Type',
        'bloodType',
        <Select
          value={formData.bloodType || ''}
          onValueChange={(val) => handleFieldChange('bloodType', val || null)}
        >
          <SelectTrigger className="h-9 text-sm focus:ring-teal-500">
            <SelectValue placeholder="Select Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNKNOWN">Unknown</SelectItem>
            <SelectItem value="A_POSITIVE">A+</SelectItem>
            <SelectItem value="A_NEGATIVE">A-</SelectItem>
            <SelectItem value="B_POSITIVE">B+</SelectItem>
            <SelectItem value="B_NEGATIVE">B-</SelectItem>
            <SelectItem value="AB_POSITIVE">AB+</SelectItem>
            <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
            <SelectItem value="O_POSITIVE">O+</SelectItem>
            <SelectItem value="O_NEGATIVE">O-</SelectItem>
          </SelectContent>
        </Select>
      )}

      {renderField(
        'Civil Status',
        'civilStatus',
        <Select
          value={formData.civilStatus || ''}
          onValueChange={(val) => handleFieldChange('civilStatus', val || null)}
        >
          <SelectTrigger className="h-9 text-sm focus:ring-teal-500">
            <SelectValue placeholder="Select Civil Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE">Single</SelectItem>
            <SelectItem value="MARRIED">Married</SelectItem>
            <SelectItem value="DIVORCED">Divorced</SelectItem>
            <SelectItem value="WIDOWED">Widowed</SelectItem>
            <SelectItem value="SEPARATED">Separated</SelectItem>
          </SelectContent>
        </Select>
      )}

      {renderField(
        'Place of Birth',
        'placeOfBirth',
        <Input
          value={formData.placeOfBirth || ''}
          onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Place of Birth"
        />
      )}

      {renderField(
        'Nationality',
        'nationality',
        <Input
          value={formData.nationality || ''}
          onChange={(e) => handleFieldChange('nationality', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Nationality"
        />
      )}

      {renderField(
        'Religion',
        'religion',
        <Input
          value={formData.religion || ''}
          onChange={(e) => handleFieldChange('religion', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Religion"
        />
      )}

      {renderField(
        'Mobile Number',
        'mobile',
        <Input
          value={formData.mobile || ''}
          onChange={(e) => handleFieldChange('mobile', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="e.g. 09171234567"
        />
      )}

      {renderField(
        'Telephone Number',
        'telephone',
        <Input
          value={formData.telephone || ''}
          onChange={(e) => handleFieldChange('telephone', e.target.value)}
          className="h-9 text-sm focus-visible:ring-teal-500"
          placeholder="Telephone Number"
        />
      )}

      {renderField(
        'Email Address',
        'email',
        <Input
          type="email"
          value={(formData as any).email || ''}
          disabled={true} // Email is usually immutable/auth identifier
          className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-dashed"
          placeholder="Email Address"
        />
      )}
    </div>
  )
}
