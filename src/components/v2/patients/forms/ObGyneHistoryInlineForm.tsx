'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updateObGyneHistory } from '@/actions/patient-profile'
import { getActionErrorMessage } from '@/lib/action-error'
import { obGyneHistorySchema, type ObGyneHistoryFormInput } from '@/schemas/ob-gyne-history-schema'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface ObGyneHistoryInlineFormProps {
  userId: string
  currentData?: Partial<ObGyneHistoryFormInput>
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function ObGyneHistoryInlineForm({
  userId,
  currentData = {},
  onSuccess,
  saveRef,
  onDirtyChange,
}: ObGyneHistoryInlineFormProps) {
  const initialFormValues = useMemo(() => {
    return {
      menarche: currentData.menarche ?? null,
      lastMenstrualPeriod: currentData.lastMenstrualPeriod ? new Date(currentData.lastMenstrualPeriod) : null,
      menopauseAge: currentData.menopauseAge ?? null,
      menopauseStatus: currentData.menopauseStatus ?? null,
      ageAtFirstSexualIntercourse: currentData.ageAtFirstSexualIntercourse ?? null,
      isFamilyPlanning: currentData.isFamilyPlanning ?? false,
      birthControlMethod: currentData.birthControlMethod ?? '',
      menstrualPeriodDuration: currentData.menstrualPeriodDuration ?? null,
      menstrualCycleInterval: currentData.menstrualCycleInterval ?? null,
      numberOfPadsPerDay: currentData.numberOfPadsPerDay ?? null,
      gravidity: currentData.gravidity ?? null,
      parity: currentData.parity ?? null,
      fullTerm: currentData.fullTerm ?? null,
      premature: currentData.premature ?? null,
      abortion: currentData.abortion ?? null,
      livingChildren: currentData.livingChildren ?? null,
      typeOfDelivery: currentData.typeOfDelivery ?? null,
      hasPreEclampsia: currentData.hasPreEclampsia ?? false,
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

    const numericFields = [
      'menarche', 'menopauseAge', 'ageAtFirstSexualIntercourse', 
      'menstrualPeriodDuration', 'menstrualCycleInterval', 'numberOfPadsPerDay', 
      'gravidity', 'parity', 'fullTerm', 'premature', 'abortion', 'livingChildren'
    ]

    const parsedData: any = {
      lastMenstrualPeriod: formData.lastMenstrualPeriod ? new Date(formData.lastMenstrualPeriod) : null,
      menopauseStatus: formData.menopauseStatus || null,
      birthControlMethod: formData.birthControlMethod || null,
      typeOfDelivery: formData.typeOfDelivery || null,
      isFamilyPlanning: !!formData.isFamilyPlanning,
      hasPreEclampsia: !!formData.hasPreEclampsia,
    }

    numericFields.forEach((f) => {
      if (formData[f] !== null && formData[f] !== undefined && formData[f] !== '') {
        parsedData[f] = Number(formData[f])
      } else {
        parsedData[f] = null
      }
    })

    // Validation using zod schema
    const validationResult = obGyneHistorySchema.safeParse(parsedData)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error('Validation failed. Please check menstrual cycle and pregnancy values.')
      throw new Error('Validation failed')
    }

    let saveErrorMessage: string | null = null

    try {
      const result = await updateObGyneHistory(userId, validationResult.data as ObGyneHistoryFormInput)

      if (result.success) {
        toast.success(result.message || 'OB/GYN history updated successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save OB/GYN history')
        saveErrorMessage = result.error || 'Failed to save OB/GYN history'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {renderField(
          'Age of Menarche (Years)',
          'menarche',
          <Input
            type="number"
            value={formData.menarche ?? ''}
            onChange={(e) => handleFieldChange('menarche', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 12"
          />
        )}

        {renderField(
          'Last Menstrual Period (LMP)',
          'lastMenstrualPeriod',
          <Input
            type="date"
            value={formData.lastMenstrualPeriod ? new Date(formData.lastMenstrualPeriod).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange('lastMenstrualPeriod', e.target.value ? new Date(e.target.value) : null)}
            className="h-9 text-sm focus-visible:ring-teal-500"
          />
        )}

        {renderField(
          'Menstrual Cycle Interval (Days)',
          'menstrualCycleInterval',
          <Input
            type="number"
            value={formData.menstrualCycleInterval ?? ''}
            onChange={(e) => handleFieldChange('menstrualCycleInterval', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 28"
          />
        )}

        {renderField(
          'Menstrual Period Duration (Days)',
          'menstrualPeriodDuration',
          <Input
            type="number"
            value={formData.menstrualPeriodDuration ?? ''}
            onChange={(e) => handleFieldChange('menstrualPeriodDuration', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 5"
          />
        )}

        {renderField(
          'Number of Pads per Day',
          'numberOfPadsPerDay',
          <Input
            type="number"
            value={formData.numberOfPadsPerDay ?? ''}
            onChange={(e) => handleFieldChange('numberOfPadsPerDay', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 3"
          />
        )}

        {renderField(
          'Menopause Status',
          'menopauseStatus',
          <Select
            value={formData.menopauseStatus || ''}
            onValueChange={(val) => handleFieldChange('menopauseStatus', val || null)}
          >
            <SelectTrigger className="h-9 text-sm focus:ring-teal-500">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Not Applicable</SelectItem>
              <SelectItem value="PRE">Pre-menopause</SelectItem>
              <SelectItem value="PERI">Peri-menopause</SelectItem>
              <SelectItem value="POST">Post-menopause</SelectItem>
            </SelectContent>
          </Select>
        )}

        {renderField(
          'Age of Menopause',
          'menopauseAge',
          <Input
            type="number"
            disabled={formData.menopauseStatus !== 'POST'}
            value={formData.menopauseAge ?? ''}
            onChange={(e) => handleFieldChange('menopauseAge', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 50"
          />
        )}

        {renderField(
          'Age at First Intercourse',
          'ageAtFirstSexualIntercourse',
          <Input
            type="number"
            value={formData.ageAtFirstSexualIntercourse ?? ''}
            onChange={(e) => handleFieldChange('ageAtFirstSexualIntercourse', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. 18"
          />
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex items-center space-x-3 mt-2">
          <Switch
            id="isFamilyPlanning"
            checked={!!formData.isFamilyPlanning}
            onCheckedChange={(checked) => handleFieldChange('isFamilyPlanning', checked)}
          />
          <Label htmlFor="isFamilyPlanning" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Practicing Family Planning
          </Label>
        </div>

        {renderField(
          'Birth Control Method',
          'birthControlMethod',
          <Input
            disabled={!formData.isFamilyPlanning}
            value={formData.birthControlMethod || ''}
            onChange={(e) => handleFieldChange('birthControlMethod', e.target.value)}
            className="h-9 text-sm focus-visible:ring-teal-500"
            placeholder="e.g. Pill, Condom, IUD"
          />
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Pregnancy History (Obstetric Score)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {renderField(
            'Gravida (Total G)',
            'gravidity',
            <Input
              type="number"
              value={formData.gravidity ?? ''}
              onChange={(e) => handleFieldChange('gravidity', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="G"
            />
          )}

          {renderField(
            'Para (Total P)',
            'parity',
            <Input
              type="number"
              value={formData.parity ?? ''}
              onChange={(e) => handleFieldChange('parity', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="P"
            />
          )}

          {renderField(
            'Full Term (FT)',
            'fullTerm',
            <Input
              type="number"
              value={formData.fullTerm ?? ''}
              onChange={(e) => handleFieldChange('fullTerm', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="F"
            />
          )}

          {renderField(
            'Premature (PT)',
            'premature',
            <Input
              type="number"
              value={formData.premature ?? ''}
              onChange={(e) => handleFieldChange('premature', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="P"
            />
          )}

          {renderField(
            'Abortion (A)',
            'abortion',
            <Input
              type="number"
              value={formData.abortion ?? ''}
              onChange={(e) => handleFieldChange('abortion', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="A"
            />
          )}

          {renderField(
            'Living Children (L)',
            'livingChildren',
            <Input
              type="number"
              value={formData.livingChildren ?? ''}
              onChange={(e) => handleFieldChange('livingChildren', e.target.value)}
              className="h-9 text-sm focus-visible:ring-teal-500"
              placeholder="L"
            />
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {renderField(
          'Type of Delivery',
          'typeOfDelivery',
          <Select
            value={formData.typeOfDelivery || ''}
            onValueChange={(val) => handleFieldChange('typeOfDelivery', val || null)}
          >
            <SelectTrigger className="h-9 text-sm focus:ring-teal-500">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Not Applicable</SelectItem>
              <SelectItem value="VAGINAL">Vaginal</SelectItem>
              <SelectItem value="CESAREAN">Cesarean (C-Section)</SelectItem>
              <SelectItem value="MIXED">Mixed</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center space-x-3 mt-5">
          <Switch
            id="hasPreEclampsia"
            checked={!!formData.hasPreEclampsia}
            onCheckedChange={(checked) => handleFieldChange('hasPreEclampsia', checked)}
          />
          <Label htmlFor="hasPreEclampsia" className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            History of Pre-Eclampsia
          </Label>
        </div>
      </div>
    </div>
  )
}
