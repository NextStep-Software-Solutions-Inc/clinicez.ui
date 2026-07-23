'use client'

import React, { useState } from 'react'
import {
  createEmergencyContactAction,
  updateEmergencyContactAction,
  deleteEmergencyContactAction,
} from '@/actions/emergency-contact.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, Plus, X, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { emergencyContactSchema } from './schemas/emergency-contact.schema'
import { formatMobileNumber, unmaskDigits } from './schemas/mask-utils'

export interface EmergencyContactInlineFormProps {
  userId: string
  contacts: any[]
  onSuccess?: () => void
}

export function EmergencyContactInlineForm({
  userId,
  contacts,
  onSuccess,
}: EmergencyContactInlineFormProps) {
  const [activeContactId, setActiveContactId] = useState<number | 'new' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  // Form Fields
  const [formData, setFormData] = useState<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    relationship: '',
    phone: '',
    address: '',
    isPrimary: false,
  })

  const handleStartEdit = (contact: any) => {
    setFormData({
      firstName: contact.firstName || '',
      middleName: contact.middleName || '',
      lastName: contact.lastName || '',
      suffix: contact.suffix || '',
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      address: contact.address || '',
      isPrimary: !!contact.isPrimary,
    })
    setActiveContactId(contact.id)
  }

  const handleStartNew = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      relationship: '',
      phone: '',
      address: '',
      isPrimary: contacts.length === 0,
    })
    setActiveContactId('new')
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.relationship) {
      toast.error('First Name, Last Name, Phone, and Relationship are required.')
      return
    }

    setIsLoading(true)
    try {
      let result
      const nameString = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
        .filter(Boolean)
        .join(' ')

      const payload = {
        ...formData,
        name: nameString || `${formData.firstName} ${formData.lastName}`,
      }

      if (activeContactId === 'new') {
        result = await createEmergencyContactAction(userId, payload)
      } else if (typeof activeContactId === 'number') {
        result = await updateEmergencyContactAction(activeContactId, payload)
      }

      if (result) {
        toast.success(activeContactId === 'new' ? 'Emergency contact added' : 'Emergency contact updated')
        setActiveContactId(null)
        onSuccess?.()
      } else {
        toast.error('Failed to save emergency contact')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to save emergency contact'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return

    setIsLoading(true)
    try {
      const result = await deleteEmergencyContactAction(contactId)
      if (result) {
        toast.success('Emergency contact removed successfully')
        onSuccess?.()
      } else {
        toast.error('Failed to delete contact')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to delete contact'))
    } finally {
      setIsLoading(false)
    }
  }

  const validateField = (field: string, value: any) => {
    const rawVal = field === 'phone' ? unmaskDigits(value) : value
    const testData = {
      ...formData,
      [field]: rawVal,
    }

    const result = emergencyContactSchema.safeParse(testData)
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field)
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }))
        return
      }
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const renderField = (label: string, field: string, control: React.ReactElement<any>) => {
    const error = errors[field]
    return (
      <div className="space-y-1 w-full">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">
          {React.cloneElement(control, {
            onBlur: (e: any) => {
              control.props.onBlur?.(e)
              validateField(field, e.target.value)
            },
            className: `${control.props.className || ''} ${
              error ? 'border-red-500 text-red-900 focus-visible:ring-red-500 dark:border-red-500' : ''
            }`,
          })}
        </div>
        {error && <span className="text-[10px] text-red-500 font-medium block mt-0.5">{error}</span>}
      </div>
    )
  }

  if (activeContactId !== null) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {activeContactId === 'new' ? 'Add Emergency Contact' : 'Edit Emergency Contact'}
          </span>
          <button type="button" onClick={() => setActiveContactId(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 text-xs">
          {renderField(
            'First Name *',
            'firstName',
            <Input
              value={formData.firstName || ''}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="First Name"
            />
          )}

          {renderField(
            'Middle Name',
            'middleName',
            <Input
              value={formData.middleName || ''}
              onChange={(e) => handleFieldChange('middleName', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="Middle Name"
            />
          )}

          {renderField(
            'Last Name *',
            'lastName',
            <Input
              value={formData.lastName || ''}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="Last Name"
            />
          )}

          {renderField(
            'Suffix',
            'suffix',
            <Input
              value={formData.suffix || ''}
              onChange={(e) => handleFieldChange('suffix', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Jr., III"
            />
          )}

          {renderField(
            'Relationship *',
            'relationship',
            <Input
              value={formData.relationship || ''}
              onChange={(e) => handleFieldChange('relationship', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Spouse, Parent, Child"
            />
          )}

          {renderField(
            'Phone Number *',
            'phone',
            <Input
              value={formatMobileNumber(formData.phone)}
              onChange={(e) => handleFieldChange('phone', unmaskDigits(e.target.value))}
              maxLength={13}
              className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
              placeholder="09XX-XXX-XXXX"
            />
          )}

          <div className="sm:col-span-2">
            {renderField(
              'Address / Location',
              'address',
              <Input
                value={formData.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="h-8 text-xs focus-visible:ring-teal-500"
                placeholder="Optional Address"
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <Switch
            id="contact-primary"
            checked={!!formData.isPrimary}
            onCheckedChange={(checked) => handleFieldChange('isPrimary', checked)}
          />
          <Label htmlFor="contact-primary" className="text-xs font-semibold text-slate-700 dark:text-slate-350">
            Set as Primary Contact
          </Label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveContactId(null)}
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
            Save Contact
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
          Add Contact
        </Button>
      </div>

      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${contact.isPrimary ? 'text-teal-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {contact.isPrimary ? 'Primary Contact' : 'Additional Contact'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                  {contact.firstName} {contact.lastName} ({contact.relationship})
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone: <span className="text-slate-900 dark:text-white font-bold">{contact.phone}</span>
                </p>
                {contact.address && (
                  <p className="text-xs text-slate-500">
                    Address: {contact.address}
                  </p>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartEdit(contact)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 rounded transition-colors text-slate-400"
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
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
            No emergency contacts logged yet.
          </span>
        </div>
      )}
    </div>
  )
}
