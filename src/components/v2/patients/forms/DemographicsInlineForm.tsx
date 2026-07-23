'use client'

import React, { useState, useEffect } from 'react'
import { updateDemographics } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { demographicsSchema as schemaVal } from './schemas/demographics.schema'
import { type DemographicsFormInput } from '@/schemas/demographics-schema'
import { formatMobileNumber, unmaskDigits } from './schemas/mask-utils'
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
  const [formData, setFormData] = useState<any>(currentData)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  // Track changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(currentData)

  useEffect(() => {
    onDirtyChange?.(hasChanges)
  }, [hasChanges, onDirtyChange])

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    // Validation using zod schema
    const validationResult = schemaVal.safeParse({
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
      validationResult.error.errors.forEach((err: any) => {
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
      const result = await updateDemographics(userId, validationResult.data as unknown as DemographicsFormInput)

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

  const validateField = (field: string, value: any) => {
    const rawVal = field === 'mobileNo' ? unmaskDigits(value) : value
    const testData = {
      ...formData,
      [field]: rawVal,
    }

    const result = schemaVal.safeParse(testData)
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field)
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }))
        return
      }
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const renderField = (
    label: string,
    field: string,
    control: React.ReactElement<any>
  ) => {
    const error = errors[field]
    return (
      <div className="space-y-1 w-full">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">
          {React.cloneElement(control, {
            onBlur: (e: any) => {
              control.props.onBlur?.(e)
              validateField(field, e.target.value)
            },
            className: `${control.props.className || ''} ${
              error ? 'border-red-500 text-red-900 focus-visible:ring-red-500 dark:border-red-500' : ''
            }`,
          })}
        </div>
        {error && (
          <span className="text-[10px] text-red-500 font-medium block mt-0.5">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 py-1.5">
      {renderField(
        'First Name',
        'firstName',
        <Input
          value={formData.firstName || ''}
          onChange={(e) => handleFieldChange('firstName', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="First Name"
        />
      )}

      {renderField(
        'Middle Name',
        'middleName',
        <Input
          value={formData.middleName || ''}
          onChange={(e) => handleFieldChange('middleName', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="Middle Name"
        />
      )}

      {renderField(
        'Last Name',
        'lastName',
        <Input
          value={formData.lastName || ''}
          onChange={(e) => handleFieldChange('lastName', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="Last Name"
        />
      )}

      {renderField(
        'Suffix',
        'suffix',
        <Input
          value={formData.suffix || ''}
          onChange={(e) => handleFieldChange('suffix', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="e.g. Jr., Sr., III"
        />
      )}

      {renderField(
        'Nickname',
        'nickname',
        <Input
          value={formData.nickname || ''}
          onChange={(e) => handleFieldChange('nickname', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
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
          className="h-8 text-xs focus-visible:ring-teal-500"
        />
      )}

      {renderField(
        'Gender',
        'gender',
        <Select
          value={formData.gender || ''}
          onValueChange={(val) => handleFieldChange('gender', val || null)}
        >
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
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
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
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
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
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
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="Place of Birth"
        />
      )}

      {renderField(
        'Nationality',
        'nationality',
        <Input
          value={formData.nationality || ''}
          onChange={(e) => handleFieldChange('nationality', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="Nationality"
        />
      )}

      {renderField(
        'Religion',
        'religion',
        <Input
          value={formData.religion || ''}
          onChange={(e) => handleFieldChange('religion', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder="Religion"
        />
      )}

      {renderField(
        'Mobile Number',
        'mobile',
        <Input
          value={formatMobileNumber(formData.mobile)}
          onChange={(e) => handleFieldChange('mobile', unmaskDigits(e.target.value))}
          maxLength={13}
          className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
          placeholder="09XX-XXX-XXXX"
        />
      )}

      {renderField(
        'Telephone Number',
        'telephone',
        <Input
          value={formData.telephone || ''}
          onChange={(e) => handleFieldChange('telephone', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
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
