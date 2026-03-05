'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createSurgicalHistoryAction, updateSurgicalHistoryAction, deleteSurgicalHistoryAction } from '@/actions/family-and-personal-history.action'
import { FormModal, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'

interface SurgicalRecord {
  id: number
  operationName: string
  operationDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SurgicalHistoryEditFormProps {
  userId: string
  currentSurgeries?: SurgicalRecord[]
  onSuccess?: () => void
  inline?: boolean
}

/**
 * SurgicalHistoryEditForm - Track surgical procedures
 * User-friendly: Add, edit, delete surgical operations
 */
export function SurgicalHistoryEditForm({
  userId,
  currentSurgeries = [],
  onSuccess,
  inline = false,
}: SurgicalHistoryEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [surgeries, setSurgeries] = useState<SurgicalRecord[]>(currentSurgeries || [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    operationName: '',
    operationDate: '',
    notes: '',
  })

  // Sync form state with parent props when dialog opens or props change
  useEffect(() => {
    if (isOpen || inline) {
      setSurgeries(currentSurgeries || [])
    }
  }, [isOpen, currentSurgeries, inline])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(surgeries) !== JSON.stringify(currentSurgeries || [])
  }, [surgeries, currentSurgeries])

  const handleAddSurgery = async () => {
    if (!formData.operationName?.trim()) {
      toast.error('Please enter an operation name')
      return
    }

    setIsLoading(true)

    try {
      const result = await createSurgicalHistoryAction(userId, {
        operationName: formData.operationName,
        operationDate: formData.operationDate ? new Date(formData.operationDate) : null,
        notes: formData.notes || null,
      })

      if (result.status) {
        toast.success('Surgical history added successfully')
        if (result.data) {
          const newSurgery: SurgicalRecord = {
            id: result.data.id,
            operationName: result.data.operationName,
            operationDate: result.data.operationDate
              ? new Date(result.data.operationDate).toISOString()
              : null,
            notes: result.data.notes,
            createdAt: new Date(result.data.createdAt).toISOString(),
            updatedAt: new Date(result.data.updatedAt).toISOString(),
            deletedAt: null,
          }
          setSurgeries([...surgeries, newSurgery])
        }
        setFormData({ operationName: '', operationDate: '', notes: '' })
        onSuccess?.()
      } else {
        toast.error(result.message || 'Failed to add surgical history')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred. Please try again.'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSurgery = async () => {
    if (!editingId) return

    if (!formData.operationName?.trim()) {
      toast.error('Please enter an operation name')
      return
    }

    setIsLoading(true)

    try {
      const result = await updateSurgicalHistoryAction(editingId, {
        operationName: formData.operationName,
        operationDate: formData.operationDate ? new Date(formData.operationDate) : null,
        notes: formData.notes || null,
      })

      if (result.status) {
        toast.success('Surgical history updated successfully')
        setSurgeries(
          surgeries.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  operationName: formData.operationName,
                  operationDate: formData.operationDate
                    ? new Date(formData.operationDate).toISOString()
                    : null,
                  notes: formData.notes,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        )
        setFormData({ operationName: '', operationDate: '', notes: '' })
        setEditingId(null)
        onSuccess?.()
      } else {
        toast.error(result.message || 'Failed to update surgical history')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred. Please try again.'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSurgery = async (id: number) => {
    if (!confirm('Are you sure you want to delete this surgical history?')) {
      return
    }

    setIsLoading(true)

    try {
      const result = await deleteSurgicalHistoryAction(id)

      if (result.status) {
        toast.success('Surgical history deleted successfully')
        setSurgeries(surgeries.filter((s) => s.id !== id))
        onSuccess?.()
      } else {
        toast.error(result.message || 'Failed to delete surgical history')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'An unexpected error occurred. Please try again.'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (surgery: SurgicalRecord) => {
    setEditingId(surgery.id)
    setFormData({
      operationName: surgery.operationName,
      operationDate: surgery.operationDate
        ? new Date(surgery.operationDate).toISOString().split('T')[0]
        : '',
      notes: surgery.notes || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ operationName: '', operationDate: '', notes: '' })
  }

  const formContent = (
    <div className="space-y-6">
      {/* Existing Surgeries List */}
      {surgeries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Surgical History</h3>
          <div className="space-y-2">
            {surgeries.map((surgery: any) => (
              <div key={surgery.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{surgery.operationName}</p>
                  {surgery.operationDate && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(surgery.operationDate).toLocaleDateString()}
                    </p>
                  )}
                  {surgery.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{surgery.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(surgery)}
                    disabled={isLoading}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900 disabled:opacity-50 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSurgery(surgery.id)}
                    disabled={isLoading}
                    className="p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900 disabled:opacity-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
        <div>
          <label className="block text-sm font-medium mb-1">Operation Name *</label>
          <Input
            placeholder="e.g., Appendectomy, Hernia repair"
            value={formData.operationName || ''}
            onChange={(e) => setFormData({ ...formData, operationName: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Operation</label>
          <Input
            type="date"
            value={formData.operationDate}
            onChange={(e) => setFormData({ ...formData, operationDate: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea
            placeholder="e.g., Reason for surgery, surgeon name, hospital, outcomes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          {editingId ? (
            <>
              <Button
                onClick={handleUpdateSurgery}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Updating...' : 'Update Surgery'}
              </Button>
              <Button
                onClick={handleCancelEdit}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleAddSurgery}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Adding...' : 'Add Surgery'}
            </Button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
        <p className="text-xs text-blue-700 dark:text-blue-200">
          <strong>Note:</strong> Keep records of all major surgeries for your medical history.
        </p>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="space-y-6">
        {formContent}

        <button
          onClick={() => {
            // Save inline surgical histories
          }}
          disabled={isLoading || !hasChanges}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Surgical History'}
        </button>
      </div>
    )
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit Surgical History" />

      <FormModal
        isOpen={isOpen}
        title="Surgical History"
        description="Track your surgical procedures and operations"
        onClose={() => setIsOpen(false)}
        onSubmit={async () => {
          // Inline form handles submissions directly
        }}
        isLoading={false}
        submitLabel="Done"
        submitDisabled={false}
      >
        {formContent}
      </FormModal>
    </>
  )
}
