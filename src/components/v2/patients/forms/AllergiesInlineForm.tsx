'use client'

import React, { useState } from 'react'
import { createUserAllergyAction, deleteUserAllergyAction } from '@/actions/users/user-allergy.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { AllergenV2Combobox } from './AllergenV2Combobox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { allergySchema } from '@/schemas'

export interface AllergiesInlineFormProps {
  userId: string
  allergies: any[]
  onSuccess?: () => void
}

export function AllergiesInlineForm({
  userId,
  allergies,
  onSuccess,
}: AllergiesInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // New Allergy Form
  const [formData, setFormData] = useState<any>({
    allergen: '',
    reaction: '',
    notes: '',
  })

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleAdd = async () => {
    if (!formData.allergen || !formData.reaction) {
      toast.error('Allergen and Reaction are required.')
      return
    }

    setIsLoading(true)
    try {
      // Validate schema
      const validated = allergySchema.omit({ id: true }).parse(formData)
      const result = await createUserAllergyAction({
        userId,
        allergen: validated.allergen,
        reaction: validated.reaction,
        notes: validated.notes || null,
      })

      if (result) {
        toast.success('Allergy added successfully')
        setIsAdding(false)
        setFormData({ allergen: '', reaction: '', notes: '' })
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add allergy'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (allergyId: number) => {
    if (!confirm('Are you sure you want to remove this allergy?')) return

    setIsLoading(true)
    try {
      await deleteUserAllergyAction(allergyId)
      toast.success('Allergy removed successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove allergy'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-end">
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            size="sm"
            className="text-xs flex items-center gap-1.5 h-8 bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Allergy
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-xl border border-dashed border-red-200 dark:border-red-950/30 bg-red-50/5 dark:bg-red-950/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Add New Allergy
            </span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Allergen *</label>
              <AllergenV2Combobox
                value={formData.allergen}
                onChange={(val) => handleFieldChange('allergen', val)}
                existingAllergens={allergies.map((a) => a.allergen)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reaction / Symptoms *</label>
              <Input
                value={formData.reaction}
                onChange={(e) => handleFieldChange('reaction', e.target.value)}
                className="h-8 text-xs focus-visible:ring-red-500"
                placeholder="e.g. Hives, Swelling"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Severity / Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="h-8 text-xs focus-visible:ring-red-500"
                placeholder="e.g. Severe, Avoid completely"
              />
            </div>
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
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleAdd}
              disabled={isLoading}
            >
              Save Allergy
            </Button>
          </div>
        </div>
      )}

      {allergies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allergies.map((all) => (
            <div
              key={all.id}
              className="p-4 rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {all.allergen}
                  </h4>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Reaction: <span className="text-slate-900 dark:text-white font-bold">{all.reaction}</span>
                </p>
                {all.notes && (
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    Severity: {all.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(all.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded transition-colors text-slate-400 hover:text-red-600"
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
            No known allergies logged.
          </span>
        </div>
      )}
    </div>
  )
}
