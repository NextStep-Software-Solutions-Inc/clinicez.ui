'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { addVitalSign, updateVitalSign } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { vitalSignSchema, type VitalSignFormInput } from '@/schemas/vital-signs-schema'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export interface VitalSignsInlineFormProps {
  userId: string
  currentData?: Partial<VitalSignFormInput & { id?: number }>
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function VitalSignsInlineForm({
  userId,
  currentData = {},
  onSuccess,
  saveRef,
  onDirtyChange,
}: VitalSignsInlineFormProps) {
  // Check if we are updating an existing vital sign record
  const isEditingExisting = !!currentData?.id

  // Initial state setup
  const initialFormValues = useMemo(() => {
    return {
      dateTaken: currentData.dateTaken ? new Date(currentData.dateTaken) : new Date(),
      height: currentData.height ?? null,
      weight: currentData.weight ?? null,
      bpSystolic: currentData.bpSystolic ?? null,
      bpDiastolic: currentData.bpDiastolic ?? null,
      pulseRate: currentData.pulseRate ?? null,
      temp: currentData.temp ?? null,
      spo2: currentData.spo2 ?? null,
      respRate: currentData.respRate ?? null,
      notes: currentData.notes ?? '',
      visualAcuityLeft: currentData.visualAcuityLeft ?? '',
      visualAcuityRight: currentData.visualAcuityRight ?? '',
      length: currentData.length ?? null,
      headCircumference: currentData.headCircumference ?? null,
      skinfoldThickness: currentData.skinfoldThickness ?? null,
      waistCircumference: currentData.waistCircumference ?? null,
      hipCircumference: currentData.hipCircumference ?? null,
      limbCircumference: currentData.limbCircumference ?? null,
      midUpperArmCircumference: currentData.midUpperArmCircumference ?? null,
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
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))

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

    if (!formData.dateTaken) {
      toast.error('Please select a date and time')
      return
    }

    // Check at least one vital sign value is provided
    const measurementFields = [
      'height', 'weight', 'bpSystolic', 'bpDiastolic', 'pulseRate', 
      'temp', 'spo2', 'respRate', 'length', 'headCircumference',
      'skinfoldThickness', 'waistCircumference', 'hipCircumference',
      'limbCircumference', 'midUpperArmCircumference'
    ]
    const hasAnyMeasurement = measurementFields.some((f) => formData[f] !== null && formData[f] !== undefined && formData[f] !== '')
    if (!hasAnyMeasurement) {
      toast.error('Please enter at least one measurement before saving.')
      throw new Error('No measurements provided')
    }

    // Number conversion for numeric fields
    const parsedData: any = {
      dateTaken: new Date(formData.dateTaken),
      notes: formData.notes || null,
      visualAcuityLeft: formData.visualAcuityLeft || null,
      visualAcuityRight: formData.visualAcuityRight || null,
    }

    measurementFields.forEach((f) => {
      if (formData[f] !== null && formData[f] !== undefined && formData[f] !== '') {
        parsedData[f] = Number(formData[f])
      } else {
        parsedData[f] = null
      }
    })

    // Validation using zod schema
    const validationResult = vitalSignSchema.safeParse(parsedData)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error('Validation failed. Please verify health ranges.')
      throw new Error('Validation failed')
    }

    let saveErrorMessage: string | null = null

    try {
      let result
      if (isEditingExisting && currentData?.id) {
        result = await updateVitalSign(userId, currentData.id, validationResult.data as VitalSignFormInput)
      } else {
        result = await addVitalSign(userId, validationResult.data as VitalSignFormInput)
      }

      if (result.success) {
        toast.success(result.message || 'Vital signs saved successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save vital signs')
        saveErrorMessage = result.error || 'Failed to save vital signs'
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
    <div className="space-y-6 py-2">
      {/* Date & Time taken */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {renderField(
          'Date & Time Recorded',
          'dateTaken',
          <Input
            type="datetime-local"
            value={formData.dateTaken ? new Date(new Date(formData.dateTaken).getTime() - new Date(formData.dateTaken).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange('dateTaken', e.target.value ? new Date(e.target.value) : null)}
            className="h-9 text-sm focus-visible:ring-teal-500"
          />
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Primary Measurements
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {renderField(
            'Systolic BP (mmHg)',
            'bpSystolic',
            <Input
              type="number"
              value={formData.bpSystolic ?? ''}
              onChange={(e) => handleFieldChange('bpSystolic', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 120"
            />
          )}

          {renderField(
            'Diastolic BP (mmHg)',
            'bpDiastolic',
            <Input
              type="number"
              value={formData.bpDiastolic ?? ''}
              onChange={(e) => handleFieldChange('bpDiastolic', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 80"
            />
          )}

          {renderField(
            'Heart Rate (bpm)',
            'pulseRate',
            <Input
              type="number"
              value={formData.pulseRate ?? ''}
              onChange={(e) => handleFieldChange('pulseRate', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 72"
            />
          )}

          {renderField(
            'Temperature (°C)',
            'temp',
            <Input
              type="number"
              step="0.1"
              value={formData.temp ?? ''}
              onChange={(e) => handleFieldChange('temp', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 36.5"
            />
          )}

          {renderField(
            'Weight (kg)',
            'weight',
            <Input
              type="number"
              step="0.1"
              value={formData.weight ?? ''}
              onChange={(e) => handleFieldChange('weight', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 70"
            />
          )}

          {renderField(
            'Height (cm)',
            'height',
            <Input
              type="number"
              step="0.1"
              value={formData.height ?? ''}
              onChange={(e) => handleFieldChange('height', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 175"
            />
          )}

          {renderField(
            'Oxygen Saturation (SpO₂)',
            'spo2',
            <Input
              type="number"
              value={formData.spo2 ?? ''}
              onChange={(e) => handleFieldChange('spo2', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 98"
            />
          )}

          {renderField(
            'Respiration Rate (bpm)',
            'respRate',
            <Input
              type="number"
              value={formData.respRate ?? ''}
              onChange={(e) => handleFieldChange('respRate', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 16"
            />
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Secondary & Pediatric Measurements
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {renderField(
            'Length/Height (cm)',
            'length',
            <Input
              type="number"
              step="0.1"
              value={formData.length ?? ''}
              onChange={(e) => handleFieldChange('length', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Pediatric height"
            />
          )}

          {renderField(
            'Head Circumference (cm)',
            'headCircumference',
            <Input
              type="number"
              step="0.1"
              value={formData.headCircumference ?? ''}
              onChange={(e) => handleFieldChange('headCircumference', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Pediatric head circ."
            />
          )}

          {renderField(
            'Waist Circumference (cm)',
            'waistCircumference',
            <Input
              type="number"
              step="0.1"
              value={formData.waistCircumference ?? ''}
              onChange={(e) => handleFieldChange('waistCircumference', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Waist circumference"
            />
          )}

          {renderField(
            'Hip Circumference (cm)',
            'hipCircumference',
            <Input
              type="number"
              step="0.1"
              value={formData.hipCircumference ?? ''}
              onChange={(e) => handleFieldChange('hipCircumference', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Hip circumference"
            />
          )}

          {renderField(
            'Limb Circumference (cm)',
            'limbCircumference',
            <Input
              type="number"
              step="0.1"
              value={formData.limbCircumference ?? ''}
              onChange={(e) => handleFieldChange('limbCircumference', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Limb circumference"
            />
          )}

          {renderField(
            'Mid-Upper Arm Circ. (MUAC)',
            'midUpperArmCircumference',
            <Input
              type="number"
              step="0.1"
              value={formData.midUpperArmCircumference ?? ''}
              onChange={(e) => handleFieldChange('midUpperArmCircumference', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="MUAC (cm)"
            />
          )}

          {renderField(
            'Skinfold Thickness (cm)',
            'skinfoldThickness',
            <Input
              type="number"
              step="0.1"
              value={formData.skinfoldThickness ?? ''}
              onChange={(e) => handleFieldChange('skinfoldThickness', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="Skinfold thickness"
            />
          )}

          {renderField(
            'Left Visual Acuity',
            'visualAcuityLeft',
            <Input
              value={formData.visualAcuityLeft || ''}
              onChange={(e) => handleFieldChange('visualAcuityLeft', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 20/20"
            />
          )}

          {renderField(
            'Right Visual Acuity',
            'visualAcuityRight',
            <Input
              value={formData.visualAcuityRight || ''}
              onChange={(e) => handleFieldChange('visualAcuityRight', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="e.g. 20/20"
            />
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        {renderField(
          'Clinical Notes / Remarks',
          'notes',
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="text-sm min-h-[80px] focus-visible:ring-teal-500"
            placeholder="Enter clinical notes or observations..."
          />
        )}
      </div>
    </div>
  )
}
