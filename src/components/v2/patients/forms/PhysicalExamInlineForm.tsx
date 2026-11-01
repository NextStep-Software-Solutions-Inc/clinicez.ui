'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { savePhysicalExaminationAction, deletePhysicalExaminationAction } from '@/actions/physical-exam.action'
import { getPhysicalExamLibrariesAction } from '@/actions/super-admin/physical-exam-library.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Trash2, Save } from 'lucide-react'
import type { PhysicalExamLibrary } from '@prisma/client'
import type { PhysicalExaminationFormInput } from '@/schemas/physical-examination-schema'
import { PhysicalExamSystemField } from '@/components/health-records/physical-exam-system-field'
import { formatPeCodes } from '@/lib/physical-exam-utils'

export interface PhysicalExamInlineFormProps {
  patientId: number
  currentData?: Partial<PhysicalExaminationFormInput> & { id?: string | number }
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
  const examId = currentData?.id ? String(currentData.id) : undefined
  const [libraries, setLibraries] = useState<PhysicalExamLibrary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const initialFormValues = useMemo(() => {
    const data = currentData || {}
    return {
      generalSurveyId: formatPeCodes(data.generalSurveyId),
      generalSurveyRemarks: data.generalSurveyRemarks || '',
      heentId: formatPeCodes(data.heentId),
      heentRemarks: data.heentRemarks || '',
      chestId: formatPeCodes(data.chestId),
      chestRemarks: data.chestRemarks || '',
      heartId: formatPeCodes(data.heartId),
      heartRemarks: data.heartRemarks || '',
      abdomenId: formatPeCodes(data.abdomenId),
      abdomenRemarks: data.abdomenRemarks || '',
      guId: formatPeCodes(data.guId),
      guRemarks: data.guRemarks || '',
      skinId: formatPeCodes(data.skinId),
      skinRemarks: data.skinRemarks || '',
      neuroId: formatPeCodes(data.neuroId),
      neuroRemarks: data.neuroRemarks || '',
      rectalId: formatPeCodes(data.rectalId),
      rectalRemarks: data.rectalRemarks || '',
    }
  }, [currentData])

  const [formData, setFormData] = useState<PhysicalExaminationFormInput>(initialFormValues)

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

  const handleFieldChange = (field: keyof PhysicalExaminationFormInput, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    setIsSaving(true)
    try {
      const result = await savePhysicalExaminationAction(patientId, formData, examId || undefined)
      if (result.error) {
        toast.error(result.error)
        throw new Error(result.error)
      }

      toast.success('Physical examination saved successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to save physical exam'))
      throw err
    } finally {
      setIsSaving(false)
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
    { key: 'generalSurvey', label: 'General Survey', category: 'GENSURVEY', isSingleSelect: true },
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
            <PhysicalExamSystemField
              key={sys.key}
              category={sys.category}
              label={sys.label}
              value={(formData[`${sys.key}Id` as keyof PhysicalExaminationFormInput] as string) || ''}
              onChange={(val) => handleFieldChange(`${sys.key}Id` as keyof PhysicalExaminationFormInput, val)}
              remarks={(formData[`${sys.key}Remarks` as keyof PhysicalExaminationFormInput] as string) || ''}
              onRemarksChange={(val) => handleFieldChange(`${sys.key}Remarks` as keyof PhysicalExaminationFormInput, val)}
              options={categoryOptions}
              isSingleSelect={sys.isSingleSelect}
              compact={true}
            />
          )
        })}
      </div>

      {(examId || !saveRef) && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {examId && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="text-xs h-8 flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Exam Record
              </Button>
            )}
          </div>

          {!saveRef && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isDeleting}
              className="text-xs h-8 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-white" />}
              Save Changes
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
