'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { updateObGyneHistory } from '@/actions/patient-profile'
import { obGyneHistorySchema, obGyneHistoryLabels, type ObGyneHistoryFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export interface ObGyneHistoryEditFormProps {
  userId: string
  currentData?: ObGyneHistoryFormInput
  onSuccess?: () => void
  inline?: boolean
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
}

/**
 * ObGyneHistoryEditForm - Female reproductive health history
 * User-friendly: Clear pregnancy statistics, menopause info, delivery details
 */
export function ObGyneHistoryEditForm({
  userId,
  currentData,
  onSuccess,
  inline = false,
  saveRef,
}: ObGyneHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<ObGyneHistoryFormInput>>(
    currentData || {}
  )

  // Sync form data when currentData prop changes (e.g., after successful save and refetch)
  useEffect(() => {
    if (currentData) {
      console.log('[ObGyneForm] Syncing form data from prop:', currentData)
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
      const result = await updateObGyneHistory(userId, formData as ObGyneHistoryFormInput)

      if (result.success) {
        toast.success(result.message || 'OB/GYN history updated successfully')
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

  const handleFieldChange = (field: keyof ObGyneHistoryFormInput, value: any) => {
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
      {/* Menarche & Menstrual */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Menstrual History</h3>

        <FormField label="Age at First Period (years)" htmlFor="menarche" helpText="Age when periods started">
          <Input
            id="menarche"
            type="number"
            min="8"
            max="16"
            value={formData.menarche || ''}
            onChange={(e) => handleFieldChange('menarche', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 13"
          />
        </FormField>

          <FormField label="Last Menstrual Period" htmlFor="lastMenstrualPeriod" helpText="Date of your last period">
            <Input
              id="lastMenstrualPeriod"
              type="date"
              value={formData.lastMenstrualPeriod ? new Date(formData.lastMenstrualPeriod).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFieldChange('lastMenstrualPeriod', e.target.value ? new Date(e.target.value) : null)}
            />
          </FormField>

          <FormField label="Cycle Interval (days)" htmlFor="menstrualCycleInterval" helpText="Number of days between periods (typically 21-35)">
            <Input
              id="menstrualCycleInterval"
              type="number"
              min="21"
              max="35"
              value={formData.menstrualCycleInterval || ''}
              onChange={(e) => handleFieldChange('menstrualCycleInterval', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 28"
            />
          </FormField>

          <FormField label="Period Duration (days)" htmlFor="menstrualPeriodDuration" helpText="How many days your period lasts">
            <Input
              id="menstrualPeriodDuration"
              type="number"
              min="1"
              max="10"
              value={formData.menstrualPeriodDuration || ''}
              onChange={(e) => handleFieldChange('menstrualPeriodDuration', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 5"
            />
          </FormField>

          <FormField label="Pads per Day" htmlFor="numberOfPadsPerDay" helpText="Average number of pads/tampons per day">
            <Input
              id="numberOfPadsPerDay"
              type="number"
              min="1"
              max="20"
              value={formData.numberOfPadsPerDay || ''}
              onChange={(e) => handleFieldChange('numberOfPadsPerDay', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 4"
            />
          </FormField>
        </div>

        {/* Menopause Status */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Menopause Status</h3>

          <FormField label="Menopause Status" htmlFor="menopauseStatus" helpText="Current menopausal status">
            <Select
              value={formData.menopauseStatus || ''}
              onValueChange={(value) => handleFieldChange('menopauseStatus', value === '_empty' ? undefined : value)}
            >
              <SelectTrigger id="menopauseStatus">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_empty">Not applicable</SelectItem>
                <SelectItem value="PRE">{obGyneHistoryLabels.menopauseStatus.PRE}</SelectItem>
                <SelectItem value="PERI">{obGyneHistoryLabels.menopauseStatus.PERI}</SelectItem>
                <SelectItem value="POST">{obGyneHistoryLabels.menopauseStatus.POST}</SelectItem>
                <SelectItem value="NONE">{obGyneHistoryLabels.menopauseStatus.NONE}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {formData.menopauseStatus && formData.menopauseStatus !== 'NONE' && (
            <FormField label="Age at Menopause (years)" htmlFor="menopauseAge" helpText="Age when menopause occurred or is expected">
              <Input
                id="menopauseAge"
                type="number"
                min="40"
                max="60"
                value={formData.menopauseAge || ''}
                onChange={(e) => handleFieldChange('menopauseAge', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 50"
              />
            </FormField>
          )}
        </div>

        {/* Sexual & Contraception */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Sexual & Contraceptive History</h3>

          <FormField label="Age at First Sexual Intercourse (years)" htmlFor="ageAtFirstSexualIntercourse" helpText="Age when sexually active (optional)">
            <Input
              id="ageAtFirstSexualIntercourse"
              type="number"
              min="12"
              max="35"
              value={formData.ageAtFirstSexualIntercourse || ''}
              onChange={(e) => handleFieldChange('ageAtFirstSexualIntercourse', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 18"
            />
          </FormField>

          <FormField label="Current Birth Control Method" htmlFor="birthControlMethod" helpText="Current contraceptive method (optional)">
            <Input
              id="birthControlMethod"
              type="text"
              maxLength={100}
              value={formData.birthControlMethod || ''}
              onChange={(e) => handleFieldChange('birthControlMethod', e.target.value || null)}
              placeholder="e.g., Oral contraceptives, IUD, None, etc."
            />
          </FormField>
        </div>

        {/* Pregnancy Statistics */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Pregnancy History</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Total Pregnancies (Gravidity)" htmlFor="gravidity" helpText="Total number of pregnancies">
              <Input
                id="gravidity"
                type="number"
                min="0"
                max="20"
                value={formData.gravidity || ''}
                onChange={(e) => handleFieldChange('gravidity', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 3"
              />
            </FormField>

            <FormField label="Deliveries (Parity)" htmlFor="parity" helpText="Total pregnancies that resulted in delivery">
              <Input
                id="parity"
                type="number"
                min="0"
                max="20"
                value={formData.parity || ''}
                onChange={(e) => handleFieldChange('parity', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 2"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Full Term" htmlFor="fullTerm" helpText="Full-term deliveries">
              <Input
                id="fullTerm"
                type="number"
                min="0"
                value={formData.fullTerm || ''}
                onChange={(e) => handleFieldChange('fullTerm', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Premature" htmlFor="premature" helpText="Premature deliveries">
              <Input
                id="premature"
                type="number"
                min="0"
                value={formData.premature || ''}
                onChange={(e) => handleFieldChange('premature', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Miscarriages" htmlFor="abortion" helpText="Miscarriages/abortions">
              <Input
                id="abortion"
                type="number"
                min="0"
                value={formData.abortion || ''}
                onChange={(e) => handleFieldChange('abortion', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </FormField>
          </div>

          <FormField label="Living Children" htmlFor="livingChildren" helpText="Number of living children">
            <Input
              id="livingChildren"
              type="number"
              min="0"
              value={formData.livingChildren || ''}
              onChange={(e) => handleFieldChange('livingChildren', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 2"
            />
          </FormField>
        </div>

        {/* Delivery Details */}
        <div className="space-y-4 border-b py-4">
          <h3 className="text-sm font-semibold">Delivery History</h3>

          <FormField label="Type of Delivery" htmlFor="typeOfDelivery" helpText="Method(s) of past deliveries">
            <Select
              value={formData.typeOfDelivery || ''}
              onValueChange={(value) => handleFieldChange('typeOfDelivery', value === '_empty' ? undefined : value)}
            >
              <SelectTrigger id="typeOfDelivery">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_empty">Not applicable</SelectItem>
                <SelectItem value="VAGINAL">{obGyneHistoryLabels.typeOfDelivery.VAGINAL}</SelectItem>
                <SelectItem value="CESAREAN">{obGyneHistoryLabels.typeOfDelivery.CESAREAN}</SelectItem>
                <SelectItem value="MIXED">{obGyneHistoryLabels.typeOfDelivery.MIXED}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Obstetric Complications */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold">Pregnancy Complications</h3>

          <FormField label="" htmlFor="hasPreEclampsia">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasPreEclampsia"
                checked={formData.hasPreEclampsia || false}
                onCheckedChange={(value) => handleFieldChange('hasPreEclampsia', value === true ? true : null)}
              />
              <label htmlFor="hasPreEclampsia" className="text-sm">
                History of Pre-eclampsia or High Blood Pressure during Pregnancy
              </label>
            </div>
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save History'}
        </button>
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit OB/GYN History" />

      <FormModal
        isOpen={isOpen}
        title="Reproductive & Gynecological History"
        description="Track your gynecological health and pregnancy history"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save History"
        size="lg"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}