'use client'

import React, { useState, useMemo } from 'react'
import {
  createEmergencyContactAction,
  updateEmergencyContactAction,
  deleteEmergencyContactAction,
  getEmergencyContactsAction,
} from '@/actions/emergency-contact.action'
import { emergencyContactSchema, type EmergencyContactFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Trash2, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export interface EmergencyContactEditFormProps {
  userId: string
  currentContacts?: EmergencyContactFormInput[]
  onSuccess?: () => void
  inline?: boolean
}

/**
 * EmergencyContactEditForm - Manage emergency contacts
 * Allows viewing, adding, updating, and removing emergency contacts
 */
export function EmergencyContactEditForm({
  userId,
  currentContacts = [],
  onSuccess,
  inline = false,
}: EmergencyContactEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState<EmergencyContactFormInput[]>(currentContacts)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newContact, setNewContact] = useState<Partial<EmergencyContactFormInput>>({})

  const hasChanges = useMemo(() => {
    return JSON.stringify(contacts) !== JSON.stringify(currentContacts || [])
  }, [contacts, currentContacts])

  const handleAddContact = async () => {
    try {
      const validatedContact = emergencyContactSchema.omit({ id: true }).parse(newContact)
      setIsLoading(true)

      const result = await createEmergencyContactAction(userId, {
        ...validatedContact,
        name: `${validatedContact.firstName} ${validatedContact.lastName}`,
        middleName: validatedContact.middleName || undefined,
        suffix: validatedContact.suffix || undefined,
        address: validatedContact.address || null,
      })

      if (result) {
        toast.success('Emergency contact added successfully')
        setContacts([...contacts, { ...newContact, id: result.id } as EmergencyContactFormInput])
        setNewContact({})
        onSuccess?.()
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to add emergency contact')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateContact = async (id: number) => {
    try {
      const validatedContact = emergencyContactSchema.omit({ id: true }).parse(newContact)
      setIsLoading(true)

      await updateEmergencyContactAction(id, {
        name: `${validatedContact.firstName} ${validatedContact.lastName}`,
        relationship: validatedContact.relationship,
        phone: validatedContact.phone,
        isPrimary: validatedContact.isPrimary,
        address: validatedContact.address || null,
      })

      toast.success('Emergency contact updated successfully')
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...newContact, id } : c) as EmergencyContactFormInput)
      )
      setEditingId(null)
      setNewContact({})
      onSuccess?.()
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to update emergency contact')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveContact = async (id: number) => {
    try {
      setIsLoading(true)
      await deleteEmergencyContactAction(id)
      toast.success('Emergency contact removed')
      setContacts((prev) => prev.filter((c) => c.id !== id))
      onSuccess?.()
    } catch (err) {
      toast.error('Failed to remove emergency contact')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPrimary = async (id: number) => {
    try {
      setIsLoading(true)
      const contact = contacts.find((c) => c.id === id)
      if (contact) {
        await updateEmergencyContactAction(id, {
          name: `${contact.firstName} ${contact.lastName}`,
          relationship: contact.relationship,
          phone: contact.phone,
          isPrimary: true,
          address: contact.address || null,
        })
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            isPrimary: c.id === id,
          }))
        )
        toast.success('Primary contact updated')
        onSuccess?.()
      }
    } catch (err) {
      toast.error('Failed to update primary contact')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-6">
      {/* Add/Edit Contact Form */}
      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
          {editingId ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required htmlFor="firstName">
            <Input
              id="firstName"
              value={newContact.firstName || ''}
              onChange={(e) => setNewContact((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="First name"
            />
          </FormField>

          <FormField label="Last Name" required htmlFor="lastName">
            <Input
              id="lastName"
              value={newContact.lastName || ''}
              onChange={(e) => setNewContact((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </FormField>
        </div>

        <FormField label="Middle Name" htmlFor="middleName">
          <Input
            id="middleName"
            value={newContact.middleName || ''}
            onChange={(e) => setNewContact((prev) => ({ ...prev, middleName: e.target.value }))}
            placeholder="Middle name (optional)"
          />
        </FormField>

        <FormField label="Relationship" required htmlFor="relationship">
          <Input
            id="relationship"
            value={newContact.relationship || ''}
            onChange={(e) => setNewContact((prev) => ({ ...prev, relationship: e.target.value }))}
            placeholder="e.g., Mother, Spouse, Sister"
          />
        </FormField>

        <FormField label="Phone Number" required htmlFor="phone">
          <Input
            id="phone"
            value={newContact.phone || ''}
            onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+63 900 123 4567"
          />
        </FormField>

        <FormField label="Address" htmlFor="address">
          <Input
            id="address"
            value={newContact.address || ''}
            onChange={(e) => setNewContact((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Address (optional)"
          />
        </FormField>

        <div className="flex gap-3">
          <Button
            onClick={() => void (editingId ? handleUpdateContact(editingId) : handleAddContact())}
            disabled={
              isLoading ||
              !newContact.firstName ||
              !newContact.lastName ||
              !newContact.relationship ||
              !newContact.phone
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? 'Update' : 'Add'} Contact
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null)
                setNewContact({})
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Current Contacts List */}
      {contacts.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Emergency Contacts ({contacts.length})
          </h3>
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={contact.id || index}
                className={`p-4 rounded-lg border ${
                  contact.isPrimary
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.isPrimary && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {contact.relationship}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{contact.phone}</p>
                    {contact.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {contact.address}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!contact.isPrimary && (
                      <button
                        onClick={() => void handleSetPrimary(contact.id!)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                        title="Set as primary"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(contact.id || null)
                        setNewContact(contact)
                      }}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => void handleRemoveContact(contact.id!)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
      <EditButton onClick={() => setIsOpen(true)} label="Manage Emergency Contacts" />

      <FormModal
        isOpen={isOpen}
        title="Manage Emergency Contacts"
        description="Add and manage your emergency contacts"
        onClose={() => setIsOpen(false)}
        onSubmit={async () => setIsOpen(false)}
        isLoading={isLoading}
        submitLabel="Done"
        submitDisabled={false}
      >
        {formContent}
      </FormModal>
    </>
  )
}
