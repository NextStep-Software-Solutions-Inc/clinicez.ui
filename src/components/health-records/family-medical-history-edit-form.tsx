'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { updateFamilyMedicalConditions } from '@/actions/patient-profile'
import { familyMedicalHistorySchema, familyMedicalHistoryGuidance, type FamilyMedicalHistoryFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { toast } from 'sonner'

export interface FamilyMedicalHistoryEditFormProps {
  userId: string
  currentConditions?: FamilyMedicalHistoryFormInput[]
  onSuccess?: () => void
  inline?: boolean
}

interface HealthCondition {
  id: number
  name: string
}

/**
 * FamilyMedicalHistoryEditForm - Track family medical conditions
 * User-friendly: Relationship tracking, genetic risk assessment
 */
export function FamilyMedicalHistoryEditForm({
  userId,
  currentConditions,
  onSuccess,
  inline = false,
}: FamilyMedicalHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingConditions, setIsFetchingConditions] = useState(false)
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])
  const [conditions, setConditions] = useState<Partial<FamilyMedicalHistoryFormInput>[]>(currentConditions || [])
  const [newConditionId, setNewConditionId] = useState<string>('')

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(conditions) !== JSON.stringify(currentConditions || [])
  }, [conditions, currentConditions])

  // Fetch health conditions from database
  useEffect(() => {
    if (isOpen && healthConditions.length === 0) {
      fetchHealthConditions()
    }
  }, [isOpen, healthConditions.length])

  const fetchHealthConditions = async () => {
    setIsFetchingConditions(true)
    try {
      const response = await fetch('/api/health-conditions')
      if (!response.ok) throw new Error('Failed to fetch conditions')
      const data = await response.json()
      setHealthConditions(data || [])
    } catch (err) {
      console.error('Error fetching health conditions:', err)
    } finally {
      setIsFetchingConditions(false)
    }
  }

  const handleAddCondition = () => {
    if (!newConditionId) {
      toast.error('Please select a condition')
      return
    }

    setConditions((prev) => [
      ...prev,
      {
        conditionId: parseInt(newConditionId),
        details: undefined,
      },
    ])
    setNewConditionId('')
  }

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateDetails = (index: number, details: string) => {
    setConditions((prev) => [
      ...prev.map((c, i) => (i === index ? { ...c, details: details || null } : c)),
    ])
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    if (conditions.length === 0) {
      toast.error('Please add at least one family medical condition or remove this section')
      return
    }

    setIsLoading(true)

    try {
      const result = await updateFamilyMedicalConditions(userId, {
        conditions: conditions as FamilyMedicalHistoryFormInput[],
      })

      if (result.success) {
        toast.success(result.message || 'Family medical history updated successfully')
        if (!inline) setIsOpen(false)
        setConditions([])
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

  const getConditionName = (conditionId: number | undefined) => {
    return healthConditions.find((c) => c.id === conditionId)?.name || 'Unknown'
  }

  const formContent = (
    <>
      {/* Current Conditions List */}
      {conditions.length > 0 && (
        <div className="mb-6 space-y-3 border-b pb-4">
          <h3 className="text-sm font-semibold">Family Conditions</h3>
          {conditions.map((condition, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="font-medium">{getConditionName(condition.conditionId)}</span>
                <Button
                  onClick={() => handleRemoveCondition(index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="text"
                value={condition.details || ''}
                onChange={(e) => handleUpdateDetails(index, e.target.value)}
                placeholder="e.g., Mother - diagnosed at age 45"
                maxLength={500}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{familyMedicalHistoryGuidance.details}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add New Condition */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold">Add Family Condition</h3>

        {isFetchingConditions ? (
          <p className="text-sm text-gray-500">Loading conditions...</p>
        ) : (
          <>
            <FormField label="Select Condition" htmlFor="familyConditionSelect" helpText="Choose from available conditions">
              <Select value={newConditionId} onValueChange={setNewConditionId}>
                <SelectTrigger id="familyConditionSelect">
                  <SelectValue placeholder="Search and select condition..." />
                </SelectTrigger>
                <SelectContent>
                  {healthConditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id.toString()}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <Button
              onClick={handleAddCondition}
              variant="outline"
              disabled={!newConditionId}
              className="w-full"
            >
              Add Family Condition
            </Button>
          </>
        )}

        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-700 dark:text-blue-200">
            <strong>Tip:</strong> In the details field, specify the family relationship (e.g., "Father", "Maternal grandmother") and their age
            when diagnosed.
          </p>
        </div>
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
          {isLoading ? 'Saving...' : 'Save Family History'}
        </button>
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit Family History" />

      <FormModal
        isOpen={isOpen}
        title="Family Medical History"
        description="Track health conditions in your family members for genetic risk assessment"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Save Family History"
        submitDisabled={!hasChanges}
      >
        {formContent}
      </FormModal>
    </>
  )
}
