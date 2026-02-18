'use client'

import React, { useState, useMemo } from 'react'
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from '@/actions/address.action'
import { addressSchema, type AddressFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Trash2, Plus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AddressEditFormProps {
  userId: string
  currentAddresses?: AddressFormInput[]
  onSuccess?: () => void
  inline?: boolean
}

/**
 * AddressEditForm - Manage user addresses
 * Allows viewing, adding, updating, and removing addresses
 */
export function AddressEditForm({
  userId,
  currentAddresses = [],
  onSuccess,
  inline = false,
}: AddressEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState<AddressFormInput[]>(currentAddresses)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newAddress, setNewAddress] = useState<Partial<AddressFormInput>>({})

  const hasChanges = useMemo(() => {
    return JSON.stringify(addresses) !== JSON.stringify(currentAddresses || [])
  }, [addresses, currentAddresses])

  const handleAddAddress = async () => {
    try {
      const validatedAddress = addressSchema.omit({ id: true }).parse(newAddress)
      setIsLoading(true)

      const result = await createAddressAction(userId, {
        ...validatedAddress,
        fullAddress: validatedAddress.address,
      } as any)

      if (result) {
        toast.success('Address added successfully')
        setAddresses([...addresses, { ...newAddress, id: result.id } as AddressFormInput])
        setNewAddress({})
        onSuccess?.()
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to add address')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAddress = async (id: number) => {
    try {
      const validatedAddress = addressSchema.parse(newAddress)
      setIsLoading(true)

      await updateAddressAction({
        id,
        ...validatedAddress,
        fullAddress: validatedAddress.address,
      } as any)

      toast.success('Address updated successfully')
      setAddresses((prev) =>
        prev.map((a) => (a.id === id ? { ...newAddress, id } : a) as AddressFormInput)
      )
      setEditingId(null)
      setNewAddress({})
      onSuccess?.()
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to update address')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAddress = async (id: number) => {
    try {
      setIsLoading(true)
      await deleteAddressAction(id)
      toast.success('Address removed')
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      onSuccess?.()
    } catch (err) {
      toast.error('Failed to remove address')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPrimary = async (id: number) => {
    try {
      setIsLoading(true)
      const address = addresses.find((a) => a.id === id)
      if (address) {
        await updateAddressAction({
          id,
          ...address,
          fullAddress: address.address,
          isPrimary: true,
        } as any)
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isPrimary: a.id === id,
          }))
        )
        toast.success('Primary address updated')
        onSuccess?.()
      }
    } catch (err) {
      toast.error('Failed to update primary address')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-6">
      {/* Add/Edit Address Form */}
      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></span>
          {editingId ? 'Edit Address' : 'Add New Address'}
        </h3>

        <FormField label="Complete Address" required htmlFor="address">
          <Input
            id="address"
            value={newAddress.address || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Complete address"
          />
        </FormField>

        <FormField label="Apartment/Unit Number" htmlFor="apartmentUnit">
          <Input
            id="apartmentUnit"
            value={newAddress.apartmentUnit || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, apartmentUnit: e.target.value }))}
            placeholder="Apt/Unit (optional)"
          />
        </FormField>

        <FormField label="Building Name" htmlFor="bldgName">
          <Input
            id="bldgName"
            value={newAddress.bldgName || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, bldgName: e.target.value }))}
            placeholder="Building name (optional)"
          />
        </FormField>

        <FormField label="Street" htmlFor="street">
          <Input
            id="street"
            value={newAddress.street || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, street: e.target.value }))}
            placeholder="Street (optional)"
          />
        </FormField>

        <FormField label="Subdivision" htmlFor="subdivision">
          <Input
            id="subdivision"
            value={newAddress.subdivision || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, subdivision: e.target.value }))}
            placeholder="Subdivision (optional)"
          />
        </FormField>

        <FormField label="Barangay" htmlFor="barangay">
          <Input
            id="barangay"
            value={newAddress.barangay || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, barangay: e.target.value }))}
            placeholder="Barangay (optional)"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" required htmlFor="city">
            <Input
              id="city"
              value={newAddress.city || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
            />
          </FormField>

          <FormField label="State/Province" required htmlFor="state">
            <Input
              id="state"
              value={newAddress.state || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="State/Province"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="ZIP/Postal Code" required htmlFor="zipCode">
            <Input
              id="zipCode"
              value={newAddress.zipCode || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
              placeholder="ZIP/Postal code"
            />
          </FormField>

          <FormField label="Country" required htmlFor="country">
            <Input
              id="country"
              value={newAddress.country || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
            />
          </FormField>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => void (editingId ? handleUpdateAddress(editingId) : handleAddAddress())}
            disabled={
              isLoading ||
              !newAddress.address ||
              !newAddress.city ||
              !newAddress.state ||
              !newAddress.zipCode ||
              !newAddress.country
            }
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? 'Update' : 'Add'} Address
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null)
                setNewAddress({})
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Current Addresses List */}
      {addresses.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Addresses ({addresses.length})
          </h3>
          <div className="space-y-3">
            {addresses.map((address, index) => (
              <div
                key={address.id || index}
                className={`p-4 rounded-lg border ${
                  address.isPrimary
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700'
                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {address.address}
                        </p>
                        {address.barangay && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {address.barangay}, {address.city}, {address.state} {address.zipCode}
                          </p>
                        )}
                        {!address.barangay && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                        )}
                        {address.isPrimary && (
                          <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded mt-1 inline-block">
                            Primary Address
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!address.isPrimary && (
                      <button
                        onClick={() => void handleSetPrimary(address.id!)}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600 dark:text-green-400"
                        title="Set as primary"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(address.id || null)
                        setNewAddress(address)
                      }}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => void handleRemoveAddress(address.id!)}
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
      <EditButton onClick={() => setIsOpen(true)} label="Manage Addresses" />

      <FormModal
        isOpen={isOpen}
        title="Manage Addresses"
        description="Add and manage your addresses"
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
