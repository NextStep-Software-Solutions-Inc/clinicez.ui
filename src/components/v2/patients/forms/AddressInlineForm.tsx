'use client'

import React, { useState } from 'react'
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from '@/actions/address.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, Plus, X, Home } from 'lucide-react'
import { toast } from 'sonner'

export interface AddressInlineFormProps {
  userId: string
  addresses: any[]
  onSuccess?: () => void
}

export function AddressInlineForm({
  userId,
  addresses,
  onSuccess,
}: AddressInlineFormProps) {
  const [activeAddressId, setActiveAddressId] = useState<number | 'new' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Simplified address fields
  const [formData, setFormData] = useState<any>({
    street: '',
    barangay: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
    isPrimary: false,
  })

  const handleStartEdit = (addr: any) => {
    setFormData({
      street: addr.street || addr.addressLine || '',
      barangay: addr.barangay || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'Philippines',
      isPrimary: !!addr.isPrimary,
    })
    setActiveAddressId(addr.id)
  }

  const handleStartNew = () => {
    setFormData({
      street: '',
      barangay: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines',
      isPrimary: addresses.length === 0, // auto-primary if first
    })
    setActiveAddressId('new')
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSave = async () => {
    if (!formData.street || !formData.city || !formData.state) {
      toast.error('Street Address, City, and Province/State are required')
      return
    }

    setIsLoading(true)
    try {
      let result
      const addressString = [
        formData.street,
        formData.barangay,
        formData.city,
        formData.state,
      ]
        .filter(Boolean)
        .join(', ')

      const payload = {
        street: formData.street,
        barangay: formData.barangay,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || '',
        country: formData.country,
        isPrimary: formData.isPrimary,
        apartmentUnit: null,
        bldgName: null,
        addressLine: null,
        subdivision: null,
        region: null,
        fullAddress: addressString || 'Unnamed Address',
      }

      if (activeAddressId === 'new') {
        result = await createAddressAction(userId, payload)
      } else if (typeof activeAddressId === 'number') {
        result = await updateAddressAction({
          ...payload,
          id: activeAddressId,
        })
      }

      if (result) {
        toast.success(activeAddressId === 'new' ? 'Address created successfully' : 'Address updated successfully')
        setActiveAddressId(null)
        onSuccess?.()
      } else {
        toast.error('Failed to save address')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to save address'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (addrId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setIsLoading(true)
    try {
      const result = await deleteAddressAction(addrId)
      if (result) {
        toast.success('Address deleted successfully')
        onSuccess?.()
      } else {
        toast.error('Failed to delete address')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to delete address'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (label: string, control: React.ReactNode) => {
    return (
      <div className="space-y-0.5 w-full">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">{control}</div>
      </div>
    )
  }

  if (activeAddressId !== null) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {activeAddressId === 'new' ? 'Add New Address' : 'Edit Address'}
          </span>
          <button type="button" onClick={() => setActiveAddressId(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 text-xs">
          <div className="sm:col-span-2">
            {renderField(
              'Street Address *',
              <Input
                value={formData.street || ''}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                className="h-8 text-xs focus-visible:ring-teal-500"
                placeholder="House/Unit no., Building/Street name, Subdivision"
              />
            )}
          </div>

          {renderField(
            'Barangay',
            <Input
              value={formData.barangay || ''}
              onChange={(e) => handleFieldChange('barangay', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Nazareth"
            />
          )}

          {renderField(
            'City/Municipality *',
            <Input
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Cagayan de Oro"
            />
          )}

          {renderField(
            'Province/State *',
            <Input
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. Misamis Oriental"
            />
          )}

          {renderField(
            'Zip Code',
            <Input
              value={formData.zipCode || ''}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              className="h-8 text-xs focus-visible:ring-teal-500"
              placeholder="e.g. 9000"
            />
          )}
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <Switch
            id="addr-primary"
            checked={!!formData.isPrimary}
            onCheckedChange={(checked) => handleFieldChange('isPrimary', checked)}
          />
          <Label htmlFor="addr-primary" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
            Set as Primary Address
          </Label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveAddressId(null)}
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
            Save Address
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
          Add Address
        </Button>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Home className={`w-4 h-4 ${addr.isPrimary ? 'text-teal-500' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {addr.isPrimary ? 'Primary Address' : 'Additional Address'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {addr.address || addr.fullAddress}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {addr.zipCode} | {addr.country}
                </p>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartEdit(addr)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 rounded transition-colors text-slate-400"
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
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
            No addresses logged yet.
          </span>
        </div>
      )}
    </div>
  )
}
