'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updatePhilhealthRecord } from '@/actions/patient-profile'
import { addPhilHealthDependent, removePhilHealthDependent } from '@/actions/patient-profile/manage-philhealth-dependents'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, UserPlus, X, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { philHealthRecordSchema, type PhilHealthRecordFormInput, type PhilHealthDependentFormInput } from '@/schemas/philhealth-record-schema'
import { formatPhilHealthPin, formatPhilSysId, formatTin, unmaskDigits } from './schemas/mask-utils'
import { philHealthSchema, dependentSchema } from './schemas/philhealth.schema'

export interface PhilHealthInlineFormProps {
  userId: string
  currentData?: {
    id?: number
    pin: string
    tin?: string
    philSysId?: string
    memberType: 'MM' | 'DD'
    photoUrl?: string
    dependents: any[]
  }
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function PhilHealthInlineForm({
  userId,
  currentData,
  onSuccess,
  saveRef,
  onDirtyChange,
}: PhilHealthInlineFormProps) {
  const initialFormValues = useMemo(() => {
    return {
      pin: currentData?.pin || '',
      tin: currentData?.tin || '',
      philSysId: currentData?.philSysId || '',
      memberType: currentData?.memberType || 'MM',
      photoUrl: currentData?.photoUrl || '',
    }
  }, [currentData])

  const [formData, setFormData] = useState<any>(initialFormValues)
  const [dependents, setDependents] = useState<any[]>(currentData?.dependents || [])
  const [isAddingDependent, setIsAddingDependent] = useState(false)
  const [newDependent, setNewDependent] = useState<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    relationship: '',
    gender: 'MALE',
    dob: '',
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Track if main form has changes
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

    if (!formData.pin) {
      toast.error('PhilHealth PIN is required')
      throw new Error('PIN is required')
    }

    // Clean data format before validation
    const parsedData: any = {
      pin: formData.pin,
      memberType: formData.memberType || 'MM',
      tin: formData.tin || null,
      philSysId: formData.philSysId || null,
      photoUrl: formData.photoUrl || null,
    }

    // Validation using zod schema
    const validationResult = philHealthRecordSchema.safeParse(parsedData)
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
      const result = await updatePhilhealthRecord(userId, validationResult.data as PhilHealthRecordFormInput)

      if (result.success) {
        toast.success(result.message || 'PhilHealth insurance saved successfully')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save PhilHealth record')
        saveErrorMessage = result.error || 'Failed to save PhilHealth record'
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

  const handleAddDependent = async () => {
    if (!newDependent.firstName) {
      toast.error('First name is required for dependent')
      return
    }
    if (!currentData?.id) {
      toast.error('Save your PhilHealth information first before adding dependents.')
      return
    }

    setIsLoading(true)
    try {
      const dependentPayload = {
        ...newDependent,
        dob: newDependent.dob ? new Date(newDependent.dob) : null,
      }
      const result = await addPhilHealthDependent(userId, currentData.id, dependentPayload as PhilHealthDependentFormInput)

      if (result.success) {
        toast.success('Dependent added successfully')
        setDependents((prev) => [...prev, result.dependent])
        setIsAddingDependent(false)
        setNewDependent({
          firstName: '',
          middleName: '',
          lastName: '',
          relationship: '',
          gender: 'MALE',
          dob: '',
        })
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to add dependent')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An error occurred adding dependent'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDependent = async (dependentId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} as a dependent?`)) return

    setIsLoading(true)
    try {
      const result = await removePhilHealthDependent(userId, dependentId)

      if (result.success) {
        toast.success('Dependent removed successfully')
        setDependents((prev) => prev.filter((d) => d.id !== dependentId))
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to remove dependent')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An error occurred removing dependent'))
    } finally {
      setIsLoading(false)
    }
  }

  const validateField = (field: string, value: any) => {
    const rawPin = field === 'pin' ? unmaskDigits(value) : formData.pin
    const rawTin = field === 'tin' ? unmaskDigits(value) : formData.tin
    const rawPhilSysId = field === 'philSysId' ? unmaskDigits(value) : formData.philSysId

    const testData = {
      pin: rawPin,
      tin: rawTin,
      philSysId: rawPhilSysId,
      memberType: formData.memberType,
    }

    const result = philHealthSchema.safeParse(testData)
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field)
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }))
        return
      }
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const renderField = (label: string, field: string, control: React.ReactElement<any>) => {
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
        {error && <span className="text-[10px] text-red-500 font-medium block mt-0.5">{error}</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4 py-1.5">
      {/* Main PhilHealth Insurance Fields */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3">
        {renderField(
          'PIN (PhilHealth ID)',
          'pin',
          <Input
            value={formatPhilHealthPin(formData.pin)}
            onChange={(e) => handleFieldChange('pin', unmaskDigits(e.target.value))}
            maxLength={14}
            className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
            placeholder="XX-XXXXXXXXX-X"
          />
        )}

        {renderField(
          'TIN',
          'tin',
          <Input
            value={formatTin(formData.tin)}
            onChange={(e) => handleFieldChange('tin', unmaskDigits(e.target.value))}
            maxLength={15}
            className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
            placeholder="XXX-XXX-XXX-XXX"
          />
        )}

        {renderField(
          'PhilSys ID',
          'philSysId',
          <Input
            value={formatPhilSysId(formData.philSysId)}
            onChange={(e) => handleFieldChange('philSysId', unmaskDigits(e.target.value))}
            maxLength={19}
            className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
        )}

        {renderField(
          'Member Type',
          'memberType',
          <Select
            value={formData.memberType || 'MM'}
            onValueChange={(val) => handleFieldChange('memberType', val)}
          >
            <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
              <SelectValue placeholder="Select Member Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM">Principal Member</SelectItem>
              <SelectItem value="DD">Dependent</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Dependents Section */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              PhilHealth Dependents
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Family members covered under this insurance plan
            </p>
          </div>
          {!isAddingDependent && currentData?.id && (
            <Button
              type="button"
              onClick={() => setIsAddingDependent(true)}
              size="sm"
              className="text-xs flex items-center gap-1.5 h-8"
              disabled={isLoading}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Dependent
            </Button>
          )}
        </div>

        {/* Add Dependent Inline Form */}
        {isAddingDependent && (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                New Dependent Info
              </span>
              <button
                type="button"
                onClick={() => setIsAddingDependent(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">First Name *</label>
                <Input
                  value={newDependent.firstName}
                  onChange={(e) => setNewDependent((prev: any) => ({ ...prev, firstName: e.target.value }))}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Middle Name</label>
                <Input
                  value={newDependent.middleName}
                  onChange={(e) => setNewDependent((prev: any) => ({ ...prev, middleName: e.target.value }))}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                  placeholder="Middle Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Last Name *</label>
                <Input
                  value={newDependent.lastName}
                  onChange={(e) => setNewDependent((prev: any) => ({ ...prev, lastName: e.target.value }))}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                  placeholder="Last Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Relationship</label>
                <Input
                  value={newDependent.relationship}
                  onChange={(e) => setNewDependent((prev: any) => ({ ...prev, relationship: e.target.value }))}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                  placeholder="e.g. Child, Spouse"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Gender</label>
                <Select
                  value={newDependent.gender}
                  onValueChange={(val) => setNewDependent((prev: any) => ({ ...prev, gender: val }))}
                >
                  <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                <Input
                  type="date"
                  value={newDependent.dob}
                  onChange={(e) => setNewDependent((prev: any) => ({ ...prev, dob: e.target.value }))}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsAddingDependent(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleAddDependent}
                disabled={isLoading}
              >
                Save Dependent
              </Button>
            </div>
          </div>
        )}

        {/* Dependents list */}
        {dependents.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Relationship</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                {dependents.map((dep) => (
                  <tr key={dep.id}>
                    <td className="px-4 py-3">
                      {dep.firstName} {dep.lastName}
                    </td>
                    <td className="px-4 py-3 capitalize">{dep.relationship ? dep.relationship.toLowerCase() : '—'}</td>
                    <td className="px-4 py-3 capitalize">{dep.gender ? dep.gender.toLowerCase() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveDependent(dep.id, `${dep.firstName} ${dep.lastName}`)}
                        className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isAddingDependent && (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
              {!currentData?.id ? (
                <div className="flex flex-col items-center gap-1 text-slate-400 text-xs font-semibold p-4">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mb-1" />
                  <span>Save insurance records first before managing dependents.</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                  No dependents added yet.
                </span>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
