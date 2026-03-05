'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  getAddressesAction,
} from '@/actions/address.action'
import { getRegions } from '@/actions/locations.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { addressSchema, type AddressFormInput } from '@/schemas'
import { FormModal, FormField, EditButton } from './index'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LocationSelector } from './LocationSelector'
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
  const [selectedCountry, setSelectedCountry] = useState<string>('Philippines')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedRegionName, setSelectedRegionName] = useState<string>('')
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('')
  const [selectedCityCode, setSelectedCityCode] = useState<string>('')
  const [selectedBarangayCode, setSelectedBarangayCode] = useState<string>('')
  const hasInitializedRef = useRef(false)
  const formRef = useRef<HTMLDivElement>(null)
  const [allRegions, setAllRegions] = useState<any[]>([])

  // Load all regions on mount to support region lookups during edit
  useEffect(() => {
    const loadAllRegions = async () => {
      try {
        const regions = await getRegions()
        setAllRegions(regions)
      } catch (err) {
        console.error('Failed to load regions:', err)
      }
    }
    loadAllRegions()
  }, [])

  // Fetch addresses on mount and when userId changes
  useEffect(() => {
    // Skip if already initialized to prevent infinite renders
    if (hasInitializedRef.current) return

    const fetchAddresses = async () => {
      try {
        const fetchedAddresses = await getAddressesAction(userId)
        // Map fullAddress to address field to match AddressFormInput type
        const mappedAddresses = fetchedAddresses.map((addr: Record<string, unknown>) => ({
          address: (addr.fullAddress as string) || '',
          id: addr.id as number,
          apartmentUnit: (addr.apartmentUnit as string | null) || null,
          bldgName: (addr.bldgName as string | null) || null,
          addressLine: (addr.addressLine as string | null) || null,
          street: (addr.street as string | null) || null,
          subdivision: (addr.subdivision as string | null) || null,
          region: (addr.region as string | null) || null,
          barangay: (addr.barangay as string | null) || null,
          city: (addr.city as string) || 'N/A',
          state: (addr.state as string) || 'N/A',
          zipCode: (addr.zipCode as string | null) || null,
          country: (addr.country as string) || 'Philippines',
          isPrimary: (addr.isPrimary as boolean) || false,
        } as AddressFormInput))
        setAddresses(mappedAddresses)
        hasInitializedRef.current = true
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
      }
    }

    if (!currentAddresses || currentAddresses.length === 0) {
      fetchAddresses()
    } else {
      hasInitializedRef.current = true
    }
  }, [userId])

  const hasChanges = useMemo(() => {
    return JSON.stringify(addresses) !== JSON.stringify(currentAddresses || [])
  }, [addresses, currentAddresses])

  const handleAddAddress = async () => {
    try {
      const addressToValidate = {
        ...newAddress,
        country: selectedCountry,
        region: selectedRegionName || null,
        // Provide default values for optional fields
        city: newAddress.city || 'N/A',
        state: newAddress.state || 'N/A',
        barangay: newAddress.barangay || null,
      }
      const validatedAddress = addressSchema.omit({ id: true }).parse(addressToValidate)
      setIsLoading(true)

      const result = await createAddressAction(userId, {
        ...validatedAddress,
        fullAddress: validatedAddress.address,
      } as any)

      if (result) {
        toast.success('Address added successfully')
        setAddresses([...addresses, { ...addressToValidate, id: result.id } as AddressFormInput])
        setNewAddress({})
        setSelectedCountry('Philippines')
        setSelectedRegion('')
        setSelectedRegionName('')
        setSelectedProvinceCode('')
        setSelectedCityCode('')
        setSelectedBarangayCode('')
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add address'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAddress = async (id: number) => {
    try {
      const addressToValidate = {
        ...newAddress,
        country: selectedCountry,
        region: selectedRegionName || null,
        // Provide default values for optional fields
        city: newAddress.city || 'N/A',
        state: newAddress.state || 'N/A',
        barangay: newAddress.barangay || null,
      }
      const validatedAddress = addressSchema.parse(addressToValidate)
      setIsLoading(true)

      await updateAddressAction({
        id,
        ...validatedAddress,
        fullAddress: validatedAddress.address,
      } as any)

      toast.success('Address updated successfully')
      setAddresses((prev) =>
        prev.map((a) => (a.id === id ? { ...addressToValidate, id } : a) as AddressFormInput)
      )
      setEditingId(null)
      setNewAddress({})
      setSelectedCountry('Philippines')
      setSelectedRegion('')
      setSelectedRegionName('')
      setSelectedProvinceCode('')
      setSelectedCityCode('')
      setSelectedBarangayCode('')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to update address'))
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
      toast.error(getActionErrorMessage(err, 'Failed to remove address'))
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
      toast.error(getActionErrorMessage(err, 'Failed to update primary address'))
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-6" ref={formRef}>
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

        {/* Country */}
        <FormField label="Country" required htmlFor="country">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Philippines">Philippines</SelectItem>
              <SelectItem value="Other">Outside Philippines</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Location Selector - Only show for Philippines */}
        {selectedCountry === 'Philippines' && (
          <LocationSelector
            region={selectedRegion}
            province={selectedProvinceCode}
            city={selectedCityCode}
            barangay={selectedBarangayCode}
            onRegionChange={(regionData) => {
              setSelectedRegion(regionData.code)
              setSelectedRegionName(regionData.name)
              setNewAddress((prev) => ({ ...prev, region: regionData.name, state: '', city: '', barangay: '' }))
              setSelectedProvinceCode('')
              setSelectedCityCode('')
              setSelectedBarangayCode('')
            }}
            onProvinceChange={(provinceData) => {
              setSelectedProvinceCode(provinceData.code)
              setNewAddress((prev) => ({ ...prev, state: provinceData.name, city: '', barangay: '' }))
              setSelectedCityCode('')
              setSelectedBarangayCode('')
            }}
            onCityChange={(cityData) => {
              setSelectedCityCode(cityData.code)
              setNewAddress((prev) => ({ ...prev, city: cityData.name }))
              setSelectedBarangayCode('')
            }}
            onBarangayChange={(barangayData) => {
              setSelectedBarangayCode(barangayData.code)
              setNewAddress((prev) => ({ ...prev, barangay: barangayData.name }))
            }}
          />
        )}

        <FormField label="ZIP/Postal Code" htmlFor="zipCode">
          <Input
            id="zipCode"
            value={newAddress.zipCode || ''}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
            placeholder="ZIP/Postal code (optional)"
          />
        </FormField>

        <div className="flex gap-3">
          <Button
            onClick={() => void (editingId ? handleUpdateAddress(editingId) : handleAddAddress())}
            disabled={
              isLoading ||
              !newAddress.address ||
              !selectedCountry ||
              (selectedCountry === 'Philippines' && (!newAddress.city || !newAddress.state))
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
                setSelectedCountry('Philippines')
                setSelectedRegion('')
                setSelectedRegionName('')
                setSelectedProvinceCode('')
                setSelectedCityCode('')
                setSelectedBarangayCode('')
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
                        setSelectedCountry(address.country || 'Philippines')
                        // Look up region code from region name
                        const regionCode = allRegions.find((r) => r.name === address.region)?.id || ''
                        setSelectedRegion(regionCode)
                        setSelectedRegionName(address.region || '')
                        // Note: Province, city, and barangay codes are not looked up during edit
                        // User may need to re-select them if they want to change
                        setSelectedProvinceCode('')
                        setSelectedCityCode('')
                        setSelectedBarangayCode('')
                        // Scroll to form
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
