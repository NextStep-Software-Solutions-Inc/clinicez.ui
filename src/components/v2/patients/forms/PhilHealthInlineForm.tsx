'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updatePhilhealthRecord } from '@/actions/patient-profile'
import { addPhilHealthDependent, removePhilHealthDependent } from '@/actions/patient-profile/manage-philhealth-dependents'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, UserPlus, X, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getPrincipalMemberByPinAction, registerPrincipalMemberAction, type PrincipalMemberInfo } from '@/actions/clinics/konsulta-report.action'
import { philHealthRecordSchema, type PhilHealthRecordFormInput, type PhilHealthDependentFormInput } from '@/schemas/philhealth-record-schema'
import { formatPhilHealthPin, formatPhilSysId, formatTin, unmaskDigits } from './schemas/mask-utils'
import { philHealthSchema, dependentSchema } from './schemas/philhealth.schema'

export interface PhilHealthInlineFormProps {
  userId: string
  currentData?: {
    id?: number
    pin: string
    principalMemberPin?: string
    dependentPin?: string
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
      principalMemberPin: currentData?.principalMemberPin || currentData?.dependentPin || '',
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
  const [principalInfo, setPrincipalInfo] = useState<PrincipalMemberInfo | null>(null)
  const [principalForm, setPrincipalForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    extensionName: '',
    dob: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
  })

  // Lookup principal member info when memberType is Dependent and Principal Member PIN is entered
  useEffect(() => {
    if (formData.memberType === 'DD' && formData.principalMemberPin?.trim()) {
      void getPrincipalMemberByPinAction(formData.principalMemberPin.trim(), userId).then((res) => {
        if (res.data) {
          setPrincipalInfo(res.data)
        } else {
          setPrincipalInfo(null)
          if (res.message?.includes('cannot link to themselves')) {
            setErrors((prev) => ({
              ...prev,
              principalMemberPin: "Patient cannot link to themselves as the Principal Member. Please enter the Principal Member's PIN.",
            }))
          }
        }
      })
    } else {
      setPrincipalInfo(null)
    }
  }, [formData.memberType, formData.principalMemberPin, userId])

  // Zod-powered real-time inline input validation
  useEffect(() => {
    const rawData = {
      pin: unmaskDigits(formData.pin),
      dependentPin: unmaskDigits(formData.principalMemberPin),
      tin: unmaskDigits(formData.tin),
      philSysId: unmaskDigits(formData.philSysId),
      memberType: formData.memberType || 'MM',
      photoUrl: formData.photoUrl || null,
      dependents: dependents || [],
    }

    const fieldErrors: Record<string, string> = {}
    const validationResult = philHealthRecordSchema.safeParse(rawData)
    if (!validationResult.success) {
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          const key = issue.path[0] === 'dependentPin' ? 'principalMemberPin' : (issue.path[0] as string)
          fieldErrors[key] = issue.message
        }
      })
    }

    if (formData.memberType === 'DD' && !principalInfo && unmaskDigits(formData.principalMemberPin)) {
      if (!principalForm.firstName?.trim()) {
        fieldErrors.principalFirstName = "Principal Member First Name is required."
      }
      if (!principalForm.lastName?.trim()) {
        fieldErrors.principalLastName = "Principal Member Last Name is required."
      }
      if (!principalForm.dob?.trim()) {
        fieldErrors.principalDob = "Principal Member Date of Birth is required."
      }
    }

    setErrors(fieldErrors)
  }, [formData, dependents, principalInfo, principalForm])

  // Track if main form has changes
  const hasChanges = useMemo(() => {
    const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialFormValues)
    const isPrincipalDirty = formData.memberType === 'DD' && !principalInfo && (
      Boolean(principalForm.firstName.trim()) ||
      Boolean(principalForm.lastName.trim()) ||
      Boolean(principalForm.dob.trim())
    )
    return isFormDirty || isPrincipalDirty
  }, [formData, initialFormValues, principalInfo, principalForm])

  useEffect(() => {
    onDirtyChange?.(hasChanges)
  }, [hasChanges, onDirtyChange])

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    const parsedData = {
      pin: unmaskDigits(formData.pin),
      dependentPin: unmaskDigits(formData.principalMemberPin),
      memberType: formData.memberType || 'MM',
      tin: unmaskDigits(formData.tin) || null,
      philSysId: unmaskDigits(formData.philSysId) || null,
      photoUrl: formData.photoUrl || null,
      dependents: dependents || [],
    }

    const validationResult = philHealthRecordSchema.safeParse(parsedData)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          const key = issue.path[0] === 'dependentPin' ? 'principalMemberPin' : (issue.path[0] as string)
          fieldErrors[key] = issue.message
        }
      })
      setErrors(fieldErrors)
      throw new Error('Please fix input field errors before saving.')
    }

    let saveErrorMessage: string | null = null

    try {
      if (formData.memberType === 'DD' && !principalInfo && unmaskDigits(formData.principalMemberPin)) {
        if (!principalForm.firstName.trim() || !principalForm.lastName.trim()) {
          const pErrors: Record<string, string> = {}
          if (!principalForm.firstName.trim()) pErrors.principalFirstName = "Principal Member First Name is required"
          if (!principalForm.lastName.trim()) pErrors.principalLastName = "Principal Member Last Name is required"
          setErrors((prev) => ({ ...prev, ...pErrors }))
          throw new Error("Please enter Principal Member First Name and Last Name.")
        }

        const regRes = await registerPrincipalMemberAction({
          pin: unmaskDigits(formData.principalMemberPin),
          firstName: principalForm.firstName,
          lastName: principalForm.lastName,
          middleName: principalForm.middleName,
          extensionName: principalForm.extensionName,
          dob: principalForm.dob,
          gender: principalForm.gender,
        })

        if (regRes && regRes.data) {
          setPrincipalInfo(regRes.data)
        }
      }

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
  }, [saveRef, formData, principalForm, principalInfo, dependents, hasChanges])

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

        {renderField(
          formData.memberType === 'DD' ? 'Patient PIN (Dependent PIN)' : 'PIN (PhilHealth ID)',
          'pin',
          <Input
            value={formatPhilHealthPin(formData.pin)}
            onChange={(e) => handleFieldChange('pin', unmaskDigits(e.target.value))}
            maxLength={14}
            className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
            placeholder="XX-XXXXXXXXX-X"
          />
        )}

        {formData.memberType === 'DD' && (
          renderField(
            'Principal Member PIN',
            'principalMemberPin',
            <Input
              value={formatPhilHealthPin(formData.principalMemberPin)}
              onChange={(e) => handleFieldChange('principalMemberPin', unmaskDigits(e.target.value))}
              maxLength={14}
              className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
              placeholder="XX-XXXXXXXXX-X"
            />
          )
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
      </div>

      {/* Read-Only Principal Member Info Block for Dependents */}
      {formData.memberType === 'DD' && (
        <div className="mt-3">
          {principalInfo ? (
            <div className="border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-900 pb-1">
                <span className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Principal Member Info (Read-Only)
                </span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded font-medium">Linked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">PIN</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{formatPhilHealthPin(principalInfo.pin)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">DOB</span>
                  <span>{principalInfo.dob}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">First Name</span>
                  <span>{principalInfo.firstName}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">Last Name</span>
                  <span>{principalInfo.lastName}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">Middle Name</span>
                  <span>{principalInfo.middleName || "—"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200 block text-[10px] uppercase">Ext Name</span>
                  <span>{principalInfo.extensionName || "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3.5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  No principal member record found in ClinicEZ matching PIN <span className="font-mono font-bold">{formatPhilHealthPin(formData.principalMemberPin) || '—'}</span>. Enter the Principal Member's details below to register and link them.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={principalForm.firstName}
                    onChange={(e) => {
                      setPrincipalForm((p) => ({ ...p, firstName: e.target.value }))
                      if (errors.principalFirstName) setErrors((prev) => ({ ...prev, principalFirstName: undefined }))
                    }}
                    placeholder="First Name"
                    className={cn("h-8 text-xs bg-white dark:bg-slate-900", errors.principalFirstName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.principalFirstName && (
                    <span className="text-[10px] text-red-500 block">{errors.principalFirstName}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={principalForm.lastName}
                    onChange={(e) => {
                      setPrincipalForm((p) => ({ ...p, lastName: e.target.value }))
                      if (errors.principalLastName) setErrors((prev) => ({ ...prev, principalLastName: undefined }))
                    }}
                    placeholder="Last Name"
                    className={cn("h-8 text-xs bg-white dark:bg-slate-900", errors.principalLastName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.principalLastName && (
                    <span className="text-[10px] text-red-500 block">{errors.principalLastName}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Middle Name
                  </label>
                  <Input
                    value={principalForm.middleName}
                    onChange={(e) => setPrincipalForm((p) => ({ ...p, middleName: e.target.value }))}
                    placeholder="Middle Name"
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ext Name / Suffix
                  </label>
                  <Input
                    value={principalForm.extensionName}
                    onChange={(e) => setPrincipalForm((p) => ({ ...p, extensionName: e.target.value }))}
                    placeholder="Jr., Sr., III"
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={principalForm.dob}
                    onChange={(e) => {
                      setPrincipalForm((p) => ({ ...p, dob: e.target.value }))
                      if (errors.principalDob) setErrors((prev) => ({ ...prev, principalDob: undefined }))
                    }}
                    className={cn("h-8 text-xs bg-white dark:bg-slate-900", errors.principalDob && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.principalDob && (
                    <span className="text-[10px] text-red-500 block">{errors.principalDob}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    value={principalForm.gender}
                    onChange={(e) => setPrincipalForm((p) => ({ ...p, gender: e.target.value as 'MALE' | 'FEMALE' }))}
                    className="h-8 text-xs w-full rounded-md border border-input bg-white dark:bg-slate-900 px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dependents Section (Only displayed for Member Type = Principal Member MM) */}
      {formData.memberType === 'MM' && (
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
          {dependents.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <p className="text-xs text-slate-400 dark:text-slate-500">No dependents added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {dep.firstName} {dep.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                      {dep.relationship || 'Dependent'} • {dep.gender?.toLowerCase() || 'unspecified'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDependent(dep.id, `${dep.firstName} ${dep.lastName}`)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
