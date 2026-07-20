'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { savePhysicalExaminationAction, deletePhysicalExaminationAction } from '@/actions/physical-exam.action'
import { getPhysicalExamLibrariesAction } from '@/actions/super-admin/physical-exam-library.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

export interface PhysicalExamInlineFormProps {
  patientId: number
  currentData?: any
  onSuccess?: () => void
  saveRef?: React.MutableRefObject<{ submit: () => Promise<void>; hasChanges: boolean } | null>
  onDirtyChange?: (isDirty: boolean) => void
}

export function PhysicalExamInlineForm({
  patientId,
  currentData = {},
  onSuccess,
  saveRef,
  onDirtyChange,
}: PhysicalExamInlineFormProps) {
  const examId = currentData?.id || null
  const [libraries, setLibraries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const initialFormValues = useMemo(() => {
    return {
      generalSurveyId: currentData.generalSurveyId || '',
      generalSurveyRemarks: currentData.generalSurveyRemarks || '',
      heentId: currentData.heentId || '',
      heentRemarks: currentData.heentRemarks || '',
      chestId: currentData.chestId || '',
      chestRemarks: currentData.chestRemarks || '',
      heartId: currentData.heartId || '',
      heartRemarks: currentData.heartRemarks || '',
      abdomenId: currentData.abdomenId || '',
      abdomenRemarks: currentData.abdomenRemarks || '',
      guId: currentData.guId || '',
      guRemarks: currentData.guRemarks || '',
      skinId: currentData.skinId || '',
      skinRemarks: currentData.skinRemarks || '',
      neuroId: currentData.neuroId || '',
      neuroRemarks: currentData.neuroRemarks || '',
      rectalId: currentData.rectalId || '',
      rectalRemarks: currentData.rectalRemarks || '',
    }
  }, [currentData])

  const [formData, setFormData] = useState<any>(initialFormValues)

  useEffect(() => {
    async function loadLibraries() {
      try {
        const result = await getPhysicalExamLibrariesAction()
        if (result && 'data' in result && result.data) {
          setLibraries(result.data)
        }
      } catch (err) {
        console.error('Failed to load physical exam libraries:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadLibraries()
  }, [])

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
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    try {
      const result = await savePhysicalExaminationAction(patientId, formData, examId)
      if (result.error) {
        toast.error(result.error)
        throw new Error(result.error)
      }

      toast.success('Physical examination saved successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to save physical exam'))
      throw err
    }
  }

  const handleDelete = async () => {
    if (!examId) return
    if (!confirm('Are you sure you want to delete this physical examination record?')) return

    setIsDeleting(true)
    try {
      const result = await deletePhysicalExaminationAction(examId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Physical examination deleted successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to delete record'))
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = { submit: handleSubmit, hasChanges }
    }
    return () => {
      if (saveRef) saveRef.current = null
    }
  }, [saveRef, formData, hasChanges])

  const systems = [
    { key: 'generalSurvey', label: 'General Survey', category: 'GENSURVEY' },
    { key: 'heent', label: 'Head, Eyes, Ears, Nose, Throat', category: 'HEENT' },
    { key: 'chest', label: 'Chest/Lungs', category: 'CHEST' },
    { key: 'heart', label: 'Cardiovascular System', category: 'HEART' },
    { key: 'abdomen', label: 'Abdomen', category: 'ABDOMEN' },
    { key: 'gu', label: 'Genitourinary', category: 'GU' },
    { key: 'skin', label: 'Skin/Extremities', category: 'SKIN' },
    { key: 'neuro', label: 'Neurological', category: 'NEURO' },
    { key: 'rectal', label: 'Rectal', category: 'RECTAL' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((sys) => {
          const categoryOptions = libraries
            .filter((l) => l.category === sys.category)
            .sort((a, b) => a.description.localeCompare(b.description))

          return (
            <div key={sys.key} className="space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-white/40 dark:bg-slate-900/10 shadow-sm">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{sys.label}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Status</span>
                  <Select
                    value={formData[`${sys.key}Id`] || ''}
                    onValueChange={(val) => handleFieldChange(`${sys.key}Id`, val)}
                  >
                    <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.code}>
                          {opt.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Remarks</span>
                  <Input
                    value={formData[`${sys.key}Remarks`] || ''}
                    onChange={(e) => handleFieldChange(`${sys.key}Remarks`, e.target.value)}
                    className="h-8 text-xs focus-visible:ring-teal-500"
                    placeholder="Additional details..."
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {examId && (
        <div className="flex justify-start pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete Exam Record
          </Button>
        </div>
      )}
    </div>
  )
}
