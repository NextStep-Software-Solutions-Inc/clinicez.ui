'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { addUserDisabilityAction, deleteUserDisabilityAction } from '@/actions/users/user-disability.action'
import { FormModal, FormField, EditButton } from './index'
import { DisabilityCombobox } from './DisabilityCombobox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { Trash2, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export interface DisabilityFormData {
  id: number
  disability: string
  dateDiagnosed: string | null
  severity: string
  notes: string | null
  isManaged: boolean | null
  reason: string | null
  diagnosedBy: string | null
}

export interface DisabilitiesEditFormProps {
  userId: string
  currentDisabilities?: DisabilityFormData[]
  onSuccess?: () => void
  inline?: boolean
}

/**
 * DisabilitiesEditForm - Manage user disabilities and illnesses
 * Allows viewing, adding, and removing disabilities
 */
export function DisabilitiesEditForm({
  userId,
  currentDisabilities = [],
  onSuccess,
  inline = false,
}: DisabilitiesEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [disabilities, setDisabilities] = useState<DisabilityFormData[]>(currentDisabilities)
  const [newDisability, setNewDisability] = useState<{
    disability?: string
    dateDiagnosed?: string
    severity?: string
    notes?: string
    isManaged?: boolean
    reason?: string
  }>({})
  const hasInitializedRef = useRef(false)

  const severityOptions = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'PROFOUND', 'UNKNOWN']

  // Prepopulate disabilities on mount
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (currentDisabilities && currentDisabilities.length > 0) {
      setDisabilities(currentDisabilities)
      hasInitializedRef.current = true
    }
  }, [currentDisabilities])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(disabilities) !== JSON.stringify(currentDisabilities || [])
  }, [disabilities, currentDisabilities])

  const handleAddDisability = async () => {
    try {
      if (!newDisability.disability || !newDisability.severity) {
        toast.error('Please fill in all required fields')
        return
      }

      setIsLoading(true)

      const result = await addUserDisabilityAction({
        userId,
        disability: newDisability.disability,
        severity: newDisability.severity as any, // Severity enum
        notes: newDisability.notes || null,
        dateDiagnosed: newDisability.dateDiagnosed ? new Date(newDisability.dateDiagnosed) : new Date(),
        isManaged: newDisability.isManaged || false,
      })

      if (result) {
        toast.success('Disability record added successfully')
        setDisabilities([
          ...disabilities,
          {
            id: result.id,
            disability: newDisability.disability,
            dateDiagnosed: newDisability.dateDiagnosed || new Date().toISOString().split('T')[0],
            severity: newDisability.severity,
            notes: newDisability.notes || null,
            isManaged: newDisability.isManaged || false,
            reason: newDisability.reason || null,
            diagnosedBy: null,
          },
        ])
        setNewDisability({})
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add disability record'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDisability = async (index: number) => {
    const disabilityToDelete = disabilities[index]

    if (!disabilityToDelete?.id) {
      toast.error('Cannot delete disability: missing ID')
      return
    }

    try {
      setIsLoading(true)
      await deleteUserDisabilityAction(disabilityToDelete.id)

      toast.success('Disability record removed successfully')
      setDisabilities((prev) => prev.filter((_, i) => i !== index))
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove disability record'))
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'MILD':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
      case 'MODERATE':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700'
      case 'SEVERE':
        return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
      case 'CRITICAL':
        return 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 border-red-400 dark:border-red-600'
      case 'PROFOUND':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
    }
  }

  const formContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
          Add New Disability or Illness
        </h3>

        <FormField label="Disability/Illness" required htmlFor="disability">
          <DisabilityCombobox
            value={newDisability.disability || ''}
            onChange={(value) => setNewDisability((prev) => ({ ...prev, disability: value }))}
            existingDisabilities={disabilities.map(d => d.disability)}
            placeholder="Search or add disability..."
          />
        </FormField>

        <div>
          <FormField label="Severity" required>
            <RadioGroup value={newDisability.severity || ''} onValueChange={(value) => setNewDisability((prev) => ({ ...prev, severity: value }))}>
              <div className="grid grid-cols-2 gap-4">
                {severityOptions.map((severity) => (
                  <div key={severity} className="flex items-center gap-2">
                    <RadioGroupItem value={severity} id={`severity-${severity}`} />
                    <Label
                      htmlFor={`severity-${severity}`}
                      className="cursor-pointer flex-1 font-medium text-sm"
                    >
                      {severity.charAt(0) + severity.slice(1).toLowerCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </FormField>
        </div>

        <FormField label="Date Diagnosed" htmlFor="dateDiagnosed">
          <Input
            id="dateDiagnosed"
            type="date"
            value={newDisability.dateDiagnosed || ''}
            onChange={(e) => setNewDisability((prev) => ({ ...prev, dateDiagnosed: e.target.value }))}
          />
        </FormField>

        <div>
          <FormField label="Is Managed">
            <RadioGroup value={newDisability.isManaged ? 'yes' : 'no'} onValueChange={(value) => setNewDisability((prev) => ({ ...prev, isManaged: value === 'yes' }))}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="managed-yes" />
                  <Label htmlFor="managed-yes" className="cursor-pointer font-medium text-sm">
                    Yes, being managed
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="managed-no" />
                  <Label htmlFor="managed-no" className="cursor-pointer font-medium text-sm">
                    No, not being managed
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </FormField>
        </div>

        <FormField label="Reason/Notes" htmlFor="reason">
          <Textarea
            id="reason"
            value={newDisability.reason || ''}
            onChange={(e) => setNewDisability((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason for diagnosis or additional details (optional)"
            className="min-h-20"
          />
        </FormField>

        <FormField label="Additional Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={newDisability.notes || ''}
            onChange={(e) => setNewDisability((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional medical notes (optional)"
            className="min-h-20"
          />
        </FormField>

        <Button
          onClick={() => void handleAddDisability()}
          disabled={isLoading || !newDisability.disability || !newDisability.severity}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Disability Record
        </Button>
      </div>

      {/* Current Disabilities List */}
      {disabilities.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Disability & Illness Records ({disabilities.length})
          </h3>
          <div className="space-y-3">
            {disabilities.map((disability, index) => (
              <div
                key={index}
                className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-purple-900 dark:text-purple-200">
                        {disability.disability}
                      </p>
                      <Badge className={`text-xs ${getSeverityColor(disability.severity)}`}>
                        {disability.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      {disability.dateDiagnosed && (
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            Diagnosed:{' '}
                            {new Date(disability.dateDiagnosed).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </p>
                      )}
                      {disability.isManaged && (
                        <p>
                          <span className="font-medium">Status:</span> Being managed
                        </p>
                      )}
                      {disability.diagnosedBy && (
                        <p>
                          <span className="font-medium">Diagnosed by:</span> {disability.diagnosedBy}
                        </p>
                      )}
                    </div>
                    {(disability.reason || disability.notes) && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 space-y-1">
                        {disability.reason && <p>Reason: {disability.reason}</p>}
                        {disability.notes && <p className="italic">Notes: {disability.notes}</p>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => void handleRemoveDisability(index)}
                    disabled={isLoading}
                    className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-purple-600 dark:text-purple-400 disabled:opacity-50"
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
      <EditButton onClick={() => setIsOpen(true)} label="Manage Disabilities & Illnesses" />

      <FormModal
        isOpen={isOpen}
        title="Disabilities & Illnesses"
        description="Track disabilities and chronic illnesses for better medical care"
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
