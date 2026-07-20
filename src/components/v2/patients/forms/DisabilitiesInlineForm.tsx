'use client'

import React, { useState } from 'react'
import { addUserDisabilityAction, deleteUserDisabilityAction } from '@/actions/users/user-disability.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { DisabilityV2Combobox } from './DisabilityV2Combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, X, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export interface DisabilitiesInlineFormProps {
  userId: string
  disabilities: any[]
  onSuccess?: () => void
}

export function DisabilitiesInlineForm({
  userId,
  disabilities,
  onSuccess,
}: DisabilitiesInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // New Disability Form
  const [formData, setFormData] = useState<any>({
    disabilityId: '',
    disabilityName: '',
    severity: 'MILD',
    notes: '',
  })

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleAdd = async () => {
    if (!formData.disabilityName || !formData.severity) {
      toast.error('Disability and Severity are required.')
      return
    }

    setIsLoading(true)
    try {
      const result = await addUserDisabilityAction({
        userId,
        disability: formData.disabilityName,
        severity: formData.severity,
        notes: formData.notes || null,
        dateDiagnosed: new Date(),
        isManaged: true,
      })

      if (result) {
        toast.success('Disability recorded successfully')
        setIsAdding(false)
        setFormData({ disabilityId: '', disabilityName: '', severity: 'MILD', notes: '' })
        onSuccess?.()
      }
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

  const renderField = (label: string, control: React.ReactNode) => {
    return (
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className="w-full">{control}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
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

      {isAdding && (
        <div className="p-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-950/30 bg-amber-50/5 dark:bg-amber-950/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Add New Disability
            </span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Disability *</span>
              <DisabilityV2Combobox
                value={formData.disabilityName || ''}
                onChange={(val) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    disabilityName: val,
                  }))
                }}
              />
            </div>

            {renderField(
              'Severity *',
              <Select
                value={formData.severity || 'MILD'}
                onValueChange={(val) => handleFieldChange('severity', val)}
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
            )}

            {renderField(
              'Notes / Details',
              <Input
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="h-8 text-xs focus-visible:ring-amber-500"
                placeholder="Optional details..."
              />
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsAdding(false)}
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

      {disabilities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {disabilities.map((dis, idx) => (
            <div
              key={dis.id || idx}
              className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {dis.disability?.name || dis.name || 'Unknown Disability'}
                  </h4>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Severity: <span className="text-slate-900 dark:text-white font-bold">{dis.severity}</span>
                </p>
                {dis.notes && (
                  <p className="text-xs text-slate-500 leading-snug">
                    Notes: {dis.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(dis.id)}
                className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
