'use client'

import React, { useState, useMemo } from 'react'
import { createUserAllergyAction, deleteUserAllergyAction } from '@/actions/users/user-allergy.action'
import { allergySchema, type AllergyFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { AllergenCombobox } from './AllergenCombobox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AllergyEditFormProps {
  userId: string
  currentAllergies?: AllergyFormInput[]
  onSuccess?: () => void
  inline?: boolean
}

/**
 * AllergyEditForm - Manage user allergies
 * Allows viewing, adding, and removing allergies
 */
export function AllergyEditForm({
  userId,
  currentAllergies = [],
  onSuccess,
  inline = false,
}: AllergyEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [allergies, setAllergies] = useState<AllergyFormInput[]>(currentAllergies)
  const [newAllergy, setNewAllergy] = useState<Partial<AllergyFormInput>>({})

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(allergies) !== JSON.stringify(currentAllergies || [])
  }, [allergies, currentAllergies])

  const handleAddAllergy = async () => {
    try {
      const validatedAllergy = allergySchema.omit({ id: true }).parse(newAllergy)
      setIsLoading(true)

      const result = await createUserAllergyAction({
        userId,
        allergen: validatedAllergy.allergen,
        reaction: validatedAllergy.reaction,
        notes: validatedAllergy.notes,
      })

      if (result) {
        toast.success('Allergy added successfully')
        setAllergies([...allergies, { ...newAllergy, id: result.id } as AllergyFormInput])
        setNewAllergy({})
        onSuccess?.()
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to add allergy')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAllergy = async (index: number) => {
    const allergyToDelete = allergies[index]
    
    if (!allergyToDelete?.id) {
      toast.error('Cannot delete allergy: missing ID')
      return
    }

    try {
      setIsLoading(true)
      await deleteUserAllergyAction(allergyToDelete.id)
      
      toast.success('Allergy removed successfully')
      setAllergies((prev) => prev.filter((_, i) => i !== index))
      onSuccess?.()
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to remove allergy')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></span>
          Add New Allergy
        </h3>

        <FormField label="Allergen" required htmlFor="allergen">
          <AllergenCombobox
            value={newAllergy.allergen || ''}
            onChange={(value) => setNewAllergy((prev) => ({ ...prev, allergen: value }))}
            existingAllergens={allergies.map(a => a.allergen)}
            placeholder="Search or add allergen..."
          />
        </FormField>

        <FormField label="Reaction" required htmlFor="reaction">
          <Textarea
            id="reaction"
            value={newAllergy.reaction || ''}
            onChange={(e) => setNewAllergy((prev) => ({ ...prev, reaction: e.target.value }))}
            placeholder="Describe the allergic reaction... e.g., Rash, anaphylaxis, difficulty breathing"
            className="min-h-24"
          />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={newAllergy.notes || ''}
            onChange={(e) => setNewAllergy((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or observations (optional)"
            className="min-h-20"
          />
        </FormField>

        <Button
          onClick={() => void handleAddAllergy()}
          disabled={isLoading || !newAllergy.allergen || !newAllergy.reaction}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Allergy
        </Button>
      </div>

      {/* Current Allergies List */}
      {allergies.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Current Allergies ({allergies.length})
          </h3>
          <div className="space-y-3">
            {allergies.map((allergy, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 dark:text-red-200">
                      {allergy.allergen}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {allergy.reaction}
                    </p>
                    {allergy.notes && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 italic">
                        Note: {allergy.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => void handleRemoveAllergy(index)}
                    disabled={isLoading}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (inline) {
    return formContent
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Manage Allergies" />

      <FormModal
        isOpen={isOpen}
        title="Manage Allergies"
        description="Add and manage your allergies to help with medical care"
        onClose={() => setIsOpen(false)}
        onSubmit={async () => setIsOpen(false)}
        isLoading={isLoading}
        submitLabel="All Set"
        submitDisabled={false}
      >
        {formContent}
      </FormModal>
    </>
  )
}
