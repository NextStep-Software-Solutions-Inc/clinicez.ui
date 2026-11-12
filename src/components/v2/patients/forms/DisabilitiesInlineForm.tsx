'use client'

import React, { useState } from 'react'
import {
  addUserDisabilityAction,
  updateUserDisabilityAction,
  deleteUserDisabilityAction,
} from '@/actions/users/user-disability.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, X, Accessibility, Edit2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const STANDARD_DISABILITIES = [
  'Physical Disability',
  'Visual Impairment',
  'Hearing Impairment',
  'Cognitive Disability',
  'Speech Impairment',
  'Others',
] as const

export type StandardDisability = (typeof STANDARD_DISABILITIES)[number]

export interface DisabilitiesInlineFormProps {
  userId: string
  disabilities?: any[]
  onSuccess?: () => void
}

export function DisabilitiesInlineForm({
  userId,
  disabilities = [],
  onSuccess,
}: DisabilitiesInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // New Disability Form State
  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>([])
  const [severity, setSeverity] = useState<string>('MILD')
  const [notes, setNotes] = useState<string>('')

  // Inline Editing State for Existing Records
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSeverity, setEditSeverity] = useState<string>('MILD')
  const [editNotes, setEditNotes] = useState<string>('')

  // Helper to extract clean disability name from any object shape
  const getDisabilityName = (dis: any): string => {
    if (typeof dis.disability === 'string' && dis.disability.trim()) return dis.disability
    if (dis.disability?.name) return dis.disability.name
    if (dis.name) return dis.name
    return 'Unknown Disability'
  }

  // Set of existing disability names (normalized to lower case)
  const existingNames = new Set(
    disabilities.map((d) => getDisabilityName(d).toLowerCase().trim())
  )

  const handleToggleDisability = (option: string, checked: boolean) => {
    setSelectedDisabilities((prev) =>
      checked ? [...prev, option] : prev.filter((item) => item !== option)
    )
  }

  const handleAdd = async () => {
    if (selectedDisabilities.length === 0) {
      toast.error('Please select at least one disability.')
      return
    }

    if (selectedDisabilities.includes('Others') && !notes.trim()) {
      toast.error('Please specify details when "Others" is selected.')
      return
    }

    // Filter out any options that might already exist
    const toAdd = selectedDisabilities.filter(
      (opt) => !existingNames.has(opt.toLowerCase().trim())
    )

    if (toAdd.length === 0) {
      toast.error('Selected disability is already recorded.')
      return
    }

    setIsLoading(true)
    try {
      for (const disName of toAdd) {
        await addUserDisabilityAction({
          userId,
          disability: disName,
          severity: severity as any,
          notes: notes.trim() || null,
          dateDiagnosed: new Date(),
          isManaged: true,
        })
      }

      toast.success(
        toAdd.length === 1
          ? 'Disability recorded successfully'
          : `${toAdd.length} disabilities recorded successfully`
      )
      setIsAdding(false)
      setSelectedDisabilities([])
      setNotes('')
      setSeverity('MILD')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add disability'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (disId: number) => {
    if (!confirm('Are you sure you want to remove this disability record?')) return

    setIsLoading(true)
    try {
      await deleteUserDisabilityAction(disId)
      toast.success('Disability record removed successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove disability'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEdit = (dis: any) => {
    setEditingId(dis.id)
    setEditSeverity(dis.severity || 'MILD')
    setEditNotes(dis.notes || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditSeverity('MILD')
    setEditNotes('')
  }

  const handleSaveEdit = async (disId: number, originalDate?: string | Date | null) => {
    setIsLoading(true)
    try {
      await updateUserDisabilityAction({
        id: disId,
        severity: editSeverity as any,
        notes: editNotes.trim() || null,
        dateDiagnosed: originalDate ? new Date(originalDate) : new Date(),
      })
      toast.success('Disability updated successfully')
      setEditingId(null)
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to update disability'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      {/* Top action button */}
      <div className="flex justify-end">
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            size="sm"
            className="text-xs flex items-center gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Disability
          </Button>
        )}
      </div>

      {/* Add New Disability with 6 Standard Checkboxes */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-950/30 bg-amber-50/5 dark:bg-amber-950/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Add New Disability
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setSelectedDisabilities([])
                setNotes('')
                setSeverity('MILD')
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Standard Checkbox Options Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Disability Type(s) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {STANDARD_DISABILITIES.map((option, idx) => {
                const isAlreadyRecorded = existingNames.has(option.toLowerCase().trim())
                const isChecked = selectedDisabilities.includes(option)
                return (
                  <div
                    key={option}
                    onClick={() => {
                      if (!isAlreadyRecorded && !isLoading) {
                        handleToggleDisability(option, !isChecked)
                      }
                    }}
                    className={cn(
                      'flex items-center space-x-2.5 p-2.5 rounded-lg border transition-all select-none cursor-pointer',
                      isAlreadyRecorded
                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <Checkbox
                      id={`disability-option-${idx}`}
                      aria-label={option}
                      checked={isChecked}
                      disabled={isAlreadyRecorded || isLoading}
                      onCheckedChange={(checked) => handleToggleDisability(option, Boolean(checked))}
                      onClick={(e) => e.stopPropagation()}
                      className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <label
                      htmlFor={`disability-option-${idx}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'text-xs font-medium cursor-pointer flex-1 flex items-center justify-between',
                        isAlreadyRecorded && 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                      )}
                    >
                      <span
                        onClick={() => {
                          if (!isAlreadyRecorded && !isLoading) {
                            handleToggleDisability(option, !isChecked)
                          }
                        }}
                      >
                        {option}
                      </span>
                      {isAlreadyRecorded && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal italic ml-1">
                          (Added)
                        </span>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Controls: Severity and Specify Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Severity *
              </label>
              <Select
                value={severity}
                onValueChange={(val) => setSeverity(val)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-amber-500">
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILD">Mild</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="SEVERE">Severe</SelectItem>
                  <SelectItem value="PROFOUND">Profound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Specify Details {selectedDisabilities.includes('Others') ? '*' : '(Optional)'}
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs focus-visible:ring-amber-500"
                placeholder={
                  selectedDisabilities.includes('Others')
                    ? 'Required: Specify details for "Others"...'
                    : 'Specify details (e.g., condition specifics, assistive devices)...'
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setIsAdding(false)
                setSelectedDisabilities([])
                setNotes('')
                setSeverity('MILD')
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleAdd}
              disabled={isLoading}
            >
              Save Disability
            </Button>
          </div>
        </div>
      )}

      {/* Existing Disabilities Listing */}
      {disabilities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {disabilities.map((dis, idx) => {
            const isEditingThis = editingId === dis.id
            const disName = getDisabilityName(dis)

            return (
              <div
                key={dis.id || idx}
                className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5 shadow-xs flex flex-col justify-between gap-3"
              >
                {isEditingThis ? (
                  /* Inline Edit Mode */
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between pb-1 border-b border-amber-200/50 dark:border-amber-900/30">
                      <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                        Editing: {disName}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                          Severity
                        </label>
                        <Select
                          value={editSeverity}
                          onValueChange={(val) => setEditSeverity(val)}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MILD">Mild</SelectItem>
                            <SelectItem value="MODERATE">Moderate</SelectItem>
                            <SelectItem value="SEVERE">Severe</SelectItem>
                            <SelectItem value="PROFOUND">Profound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">
                          Specify Details
                        </label>
                        <Input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Details..."
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handleSaveEdit(dis.id, dis.dateDiagnosed)}
                        disabled={isLoading}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal View Mode */
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Accessibility className="w-4 h-4 text-amber-500 shrink-0" />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {disName}
                        </h4>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                        Severity:{' '}
                        <span className="text-slate-900 dark:text-white font-bold">
                          {dis.severity}
                        </span>
                      </p>
                      {dis.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          <span className="font-medium text-slate-600 dark:text-slate-300">Details:</span>{' '}
                          {dis.notes}
                        </p>
                      )}
                      {dis.dateDiagnosed && (
                        <p className="text-[11px] text-slate-400">
                          Diagnosed: {new Date(dis.dateDiagnosed).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="Edit disability"
                        onClick={() => handleStartEdit(dis)}
                        className="p-1 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-400 rounded transition-colors text-slate-400"
                        title="Edit disability"
                        disabled={isLoading}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dis.id)}
                        className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            No disabilities logged.
          </span>
        </div>
      )}
    </div>
  )
}
