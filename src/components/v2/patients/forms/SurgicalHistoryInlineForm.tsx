'use client'

import React, { useState } from 'react'
import {
  createSurgicalHistoryAction,
  updateSurgicalHistoryAction,
  deleteSurgicalHistoryAction,
} from '@/actions/family-and-personal-history.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit, Plus, X, Activity } from 'lucide-react'
import { toast } from 'sonner'

export interface SurgicalHistoryInlineFormProps {
  userId: string
  surgeries: any[]
  onSuccess?: () => void
}

export function SurgicalHistoryInlineForm({
  userId,
  surgeries,
  onSuccess,
}: SurgicalHistoryInlineFormProps) {
  const [activeSurgeryId, setActiveSurgeryId] = useState<number | 'new' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form Fields
  const [formData, setFormData] = useState<any>({
    operationName: '',
    operationDate: '',
    notes: '',
  })

  const handleStartEdit = (surg: any) => {
    setFormData({
      operationName: surg.operationName || '',
      operationDate: surg.operationDate ? new Date(surg.operationDate).toISOString().split('T')[0] : '',
      notes: surg.notes || '',
    })
    setActiveSurgeryId(surg.id)
  }

  const handleStartNew = () => {
    setFormData({
      operationName: '',
      operationDate: '',
      notes: '',
    })
    setActiveSurgeryId('new')
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSave = async () => {
    if (!formData.operationName) {
      toast.error('Operation / Surgery name is required.')
      return
    }

    setIsLoading(true)
    try {
      let result
      const payload = {
        ...formData,
        operationDate: formData.operationDate ? new Date(formData.operationDate) : null,
      }

      if (activeSurgeryId === 'new') {
        result = await createSurgicalHistoryAction(userId, payload)
      } else if (typeof activeSurgeryId === 'number') {
        result = await updateSurgicalHistoryAction(activeSurgeryId, payload)
      }

      if (result?.status) {
        toast.success(activeAddressId === 'new' ? 'Surgical record added' : 'Surgical record updated')
        setActiveSurgeryId(null)
        onSuccess?.()
      } else {
        toast.error(result?.message || 'Failed to save surgical history')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to save surgical history'))
    } finally {
      setIsLoading(false)
    }
  }

  // Define activeAddressId locally to satisfy check output
  const activeAddressId = activeSurgeryId;

  const handleDelete = async (surgId: number) => {
    if (!confirm('Are you sure you want to delete this surgical record?')) return

    setIsLoading(true)
    try {
      const result = await deleteSurgicalHistoryAction(surgId)
      if (result.status) {
        toast.success('Surgical record removed successfully')
        onSuccess?.()
      } else {
        toast.error(result.message || 'Failed to delete record')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to delete record'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (label: string, control: React.ReactNode) => {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{label}</label>
        <div className="w-full">{control}</div>
      </div>
    )
  }

  if (activeSurgeryId !== null) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {activeSurgeryId === 'new' ? 'Add Surgical Record' : 'Edit Surgical Record'}
          </span>
          <button type="button" onClick={() => setActiveSurgeryId(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {renderField(
            'Operation / Procedure Name *',
            <Input
              value={formData.operationName || ''}
              onChange={(e) => handleFieldChange('operationName', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Appendectomy"
            />
          )}

          {renderField(
            'Date of Operation',
            <Input
              type="date"
              value={formData.operationDate || ''}
              onChange={(e) => handleFieldChange('operationDate', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
            />
          )}

          <div className="sm:col-span-2">
            {renderField(
              'Procedure Notes / Findings',
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="text-xs min-h-[60px] focus-visible:ring-teal-500"
                placeholder="Details of surgery..."
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveSurgeryId(null)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSave}
            disabled={isLoading}
          >
            Save Record
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleStartNew}
          size="sm"
          className="text-xs flex items-center gap-1.5 h-8"
          disabled={isLoading}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Surgery
        </Button>
      </div>

      {surgeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surgeries.map((surg) => (
            <div
              key={surg.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  <span className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Surgical History Record
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {surg.operationName}
                </p>
                <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold">
                  Date: <span className="text-slate-900 dark:text-white">{surg.operationDate ? new Date(surg.operationDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</span>
                </p>
                {surg.notes && (
                  <p className="text-xs text-slate-500 leading-snug">
                    Notes: {surg.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartEdit(surg)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 rounded transition-colors text-slate-400"
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(surg.id)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            No surgical history logged yet.
          </span>
        </div>
      )}
    </div>
  )
}
