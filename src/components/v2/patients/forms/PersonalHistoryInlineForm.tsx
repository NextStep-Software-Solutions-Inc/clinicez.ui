'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updatePersonalHistory } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { personalHistorySchema, type PersonalHistoryFormInput } from '@/schemas/personal-history-schema'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export interface PersonalHistoryInlineFormProps {
  userId: string
  currentData?: Partial<PersonalHistoryFormInput>
  patientDob?: Date | string | null
  patientAge?: number | null
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function PersonalHistoryInlineForm({
  userId,
  currentData = {},
  patientDob,
  patientAge: rawPatientAge,
  onSuccess,
  saveRef,
  onDirtyChange,
}: PersonalHistoryInlineFormProps) {
  const calculatedAge = useMemo(() => {
    if (rawPatientAge !== undefined && rawPatientAge !== null) return rawPatientAge;
    if (!patientDob) return null;
    const date = typeof patientDob === 'string' ? new Date(patientDob) : patientDob;
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age;
  }, [patientDob, rawPatientAge])

  const isSexuallyActiveApplicable = calculatedAge === null || calculatedAge >= 15;

  const initialFormValues = useMemo(() => {
    const data = currentData || {}
    return {
      smokingStatus: data.smokingStatus ?? null,
      numberOfPacksPerYear: data.numberOfPacksPerYear ?? null,
      alcoholStatus: data.alcoholStatus ?? null,
      numberOfBottlesPerDay: data.numberOfBottlesPerDay ?? null,
      illicitDrugUse: data.illicitDrugUse ?? null,
      sexuallyActive: data.sexuallyActive ?? null,
    }
  }, [currentData])

  const [formData, setFormData] = useState<any>(initialFormValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Compute hasChanges relative to baseline
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormValues)
  }, [formData, initialFormValues])

  useEffect(() => {
    onDirtyChange?.(hasChanges)
  }, [hasChanges, onDirtyChange])

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const next = { ...prev, [field]: value === '' ? null : value }
      
      // Auto-clear pack count if smoking status is set to NEVER
      if (field === 'smokingStatus' && value === 'NEVER') {
        next.numberOfPacksPerYear = null
      }
      // Auto-clear bottles count if alcohol status is set to NEVER
      if (field === 'alcoholStatus' && value === 'NEVER') {
        next.numberOfBottlesPerDay = null
      }
      
      return next
    })

    // Clear error
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

    const parsedData: any = {
      smokingStatus: formData.smokingStatus || null,
      alcoholStatus: formData.alcoholStatus || null,
      illicitDrugUse: formData.illicitDrugUse || null,
      sexuallyActive: formData.sexuallyActive || null,
    }

    if (formData.numberOfPacksPerYear !== null && formData.numberOfPacksPerYear !== undefined && formData.numberOfPacksPerYear !== '') {
      parsedData.numberOfPacksPerYear = Number(formData.numberOfPacksPerYear)
    } else {
      parsedData.numberOfPacksPerYear = null
    }

    if (formData.numberOfBottlesPerDay !== null && formData.numberOfBottlesPerDay !== undefined && formData.numberOfBottlesPerDay !== '') {
      parsedData.numberOfBottlesPerDay = Number(formData.numberOfBottlesPerDay)
    } else {
      parsedData.numberOfBottlesPerDay = null
    }

    // Validation using zod schema
    const validationResult = personalHistorySchema.safeParse(parsedData)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error('Validation failed. Please verify form details.')
      throw new Error('Validation failed')
    }

    let saveErrorMessage: string | null = null

    try {
      const result = await updatePersonalHistory(userId, validationResult.data as PersonalHistoryFormInput)

      if (result.success) {
        toast.success(result.message || 'Lifestyle history updated successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save lifestyle history')
        saveErrorMessage = result.error || 'Failed to save lifestyle history'
      }
    } catch (err) {
      const errMsg = getActionErrorMessage(err, 'An unexpected error occurred.')
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
    field: string,
    control: React.ReactNode
  ) => {
    const error = errors[field]
    return (
      <div className="space-y-1 w-full">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">{control}</div>
        {error && (
          <span className="text-[10px] text-red-500 font-medium block mt-0.5">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 py-1.5">
      {renderField(
        'Smoking Status',
        'smokingStatus',
        <Select
          value={formData.smokingStatus || ''}
          onValueChange={(val) => handleFieldChange('smokingStatus', val || null)}
        >
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_APPLICABLE">Not Applicable (N/A)</SelectItem>
            <SelectItem value="NEVER">Never smoked</SelectItem>
            <SelectItem value="FORMER">Former smoker</SelectItem>
            <SelectItem value="CURRENT">Currently smoking</SelectItem>
          </SelectContent>
        </Select>
      )}

      {renderField(
        'Packs per Year',
        'numberOfPacksPerYear',
        <Input
          type="number"
          disabled={formData.smokingStatus === 'NEVER' || formData.smokingStatus === 'NOT_APPLICABLE' || !formData.smokingStatus}
          value={formData.numberOfPacksPerYear ?? ''}
          onChange={(e) => handleFieldChange('numberOfPacksPerYear', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder={formData.smokingStatus === 'NEVER' || formData.smokingStatus === 'NOT_APPLICABLE' ? 'N/A' : 'e.g. 5'}
        />
      )}

      {renderField(
        'Alcohol Intake',
        'alcoholStatus',
        <Select
          value={formData.alcoholStatus || ''}
          onValueChange={(val) => handleFieldChange('alcoholStatus', val || null)}
        >
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_APPLICABLE">Not Applicable (N/A)</SelectItem>
            <SelectItem value="NEVER">Never drink alcohol</SelectItem>
            <SelectItem value="OCCASIONAL">Occasional (a few times per year)</SelectItem>
            <SelectItem value="REGULAR">Regular (weekly)</SelectItem>
            <SelectItem value="HEAVY">Heavy use (daily)</SelectItem>
          </SelectContent>
        </Select>
      )}

      {renderField(
        'Bottles per Day',
        'numberOfBottlesPerDay',
        <Input
          type="number"
          disabled={formData.alcoholStatus === 'NEVER' || formData.alcoholStatus === 'NOT_APPLICABLE' || !formData.alcoholStatus}
          value={formData.numberOfBottlesPerDay ?? ''}
          onChange={(e) => handleFieldChange('numberOfBottlesPerDay', e.target.value)}
          className="h-8 text-xs focus-visible:ring-teal-500"
          placeholder={formData.alcoholStatus === 'NEVER' || formData.alcoholStatus === 'NOT_APPLICABLE' ? 'N/A' : 'e.g. 2'}
        />
      )}

      {renderField(
        'Drug Use Status',
        'illicitDrugUse',
        <Select
          value={formData.illicitDrugUse || ''}
          onValueChange={(val) => handleFieldChange('illicitDrugUse', val || null)}
        >
          <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_APPLICABLE">Not Applicable (N/A)</SelectItem>
            <SelectItem value="NEVER">Never used</SelectItem>
            <SelectItem value="FORMER">Former user</SelectItem>
            <SelectItem value="CURRENT">Currently using</SelectItem>
          </SelectContent>
        </Select>
      )}

      {isSexuallyActiveApplicable ? (
        renderField(
          'Sexually Active',
          'sexuallyActive',
          <Select
            value={formData.sexuallyActive || ''}
            onValueChange={(val) => handleFieldChange('sexuallyActive', val || null)}
          >
            <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YES">Yes, currently active</SelectItem>
              <SelectItem value="NO">No, not active</SelectItem>
              <SelectItem value="INACTIVE">Prefer not to answer</SelectItem>
            </SelectContent>
          </Select>
        )
      ) : (
        renderField(
          'Sexually Active',
          'sexuallyActive',
          <Input
            disabled
            value="N/A (Patient < 15 yrs)"
            className="h-8 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500"
          />
        )
      )}
    </div>
  )
}
