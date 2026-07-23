'use client'

import React, { useState, useEffect } from 'react'
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from '@/actions/address.action'
import {
  getRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
} from '@/actions/locations.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit, Plus, X, Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addressSchema } from './schemas/address.schema'
import type { RegionOption, ProvinceOption, CityOption, BarangayOption } from '@/types/locations'

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
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  // Cascading location options
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [barangays, setBarangays] = useState<BarangayOption[]>([])

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  // Address form fields
  const [formData, setFormData] = useState<any>({
    street: '',
    regionCode: '',
    regionName: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    barangayCode: '',
    barangayName: '',
    zipCode: '',
    country: 'Philippines',
    isPrimary: false,
  })

  // Load Regions on component mount
  useEffect(() => {
    getRegions()
      .then((data) => setRegions(data))
      .catch((err) => console.error('Failed to load regions:', err))
  }, [])

  const handleStartEdit = async (addr: any) => {
    setActiveAddressId(addr.id)
    setErrors({})
    setFormData({
      street: addr.street || addr.addressLine || '',
      regionCode: addr.regionCode || '',
      regionName: addr.region || '',
      provinceCode: addr.provinceCode || '',
      provinceName: addr.state || addr.province || '',
      cityCode: addr.cityCode || '',
      cityName: addr.city || '',
      barangayCode: addr.barangayCode || '',
      barangayName: addr.barangay || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'Philippines',
      isPrimary: !!addr.isPrimary,
    })

    // Pre-populate cascading dropdown options if codes exist
    if (addr.regionCode) {
      setLoadingProvinces(true)
      getProvincesByRegion(addr.regionCode)
        .then((data) => setProvinces(data))
        .finally(() => setLoadingProvinces(false))
    }
    if (addr.provinceCode) {
      setLoadingCities(true)
      getCitiesByProvince(addr.provinceCode)
        .then((data) => setCities(data))
        .finally(() => setLoadingCities(false))
    }
    if (addr.cityCode) {
      setLoadingBarangays(true)
      getBarangaysByCity(addr.cityCode)
        .then((data) => setBarangays(data))
        .finally(() => setLoadingBarangays(false))
    }
  }

  const handleStartNew = () => {
    setErrors({})
    setProvinces([])
    setCities([])
    setBarangays([])
    setFormData({
      street: '',
      regionCode: '',
      regionName: '',
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      barangayCode: '',
      barangayName: '',
      zipCode: '',
      country: 'Philippines',
      isPrimary: addresses.length === 0,
    })
    setActiveAddressId('new')
  }

  const handleRegionChange = async (regionCode: string) => {
    const reg = regions.find((r) => r.code === regionCode)
    setFormData((prev: any) => ({
      ...prev,
      regionCode,
      regionName: reg?.name || '',
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      barangayCode: '',
      barangayName: '',
    }))
    setProvinces([])
    setCities([])
    setBarangays([])

    if (regionCode) {
      setLoadingProvinces(true)
      try {
        const provs = await getProvincesByRegion(regionCode)
        setProvinces(provs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProvinces(false)
      }
    }
  }

  const handleProvinceChange = async (provinceCode: string) => {
    const prov = provinces.find((p) => p.code === provinceCode)
    setFormData((prev: any) => ({
      ...prev,
      provinceCode,
      provinceName: prov?.name || '',
      cityCode: '',
      cityName: '',
      barangayCode: '',
      barangayName: '',
    }))
    setCities([])
    setBarangays([])

    if (provinceCode) {
      setLoadingCities(true)
      try {
        const cits = await getCitiesByProvince(provinceCode)
        setCities(cits)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCities(false)
      }
    }
  }

  const handleCityChange = async (cityCode: string) => {
    const cit = cities.find((c) => c.code === cityCode)
    setFormData((prev: any) => ({
      ...prev,
      cityCode,
      cityName: cit?.name || '',
      barangayCode: '',
      barangayName: '',
    }))
    setBarangays([])

    if (cityCode) {
      setLoadingBarangays(true)
      try {
        const brgys = await getBarangaysByCity(cityCode)
        setBarangays(brgys)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingBarangays(false)
      }
    }
  }

  const handleBarangayChange = (barangayCode: string) => {
    const brgy = barangays.find((b) => b.code === barangayCode)
    setFormData((prev: any) => ({
      ...prev,
      barangayCode,
      barangayName: brgy?.name || '',
    }))
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleSave = async () => {
    const cityValue = formData.cityName || formData.cityCode || ''
    const provinceValue = formData.provinceName || formData.provinceCode || ''

    if (!formData.street || !cityValue || !provinceValue) {
      toast.error('Street Address, City, and Province are required')
      return
    }

    setIsLoading(true)
    try {
      let result
      const addressString = [
        formData.street,
        formData.barangayName,
        formData.cityName,
        formData.provinceName,
        formData.regionName,
      ]
        .filter(Boolean)
        .join(', ')

      const payload = {
        street: formData.street,
        barangay: formData.barangayName || null,
        city: formData.cityName || cityValue,
        state: formData.provinceName || provinceValue,
        zipCode: formData.zipCode || '',
        country: formData.country || 'Philippines',
        isPrimary: formData.isPrimary,
        apartmentUnit: null,
        bldgName: null,
        addressLine: null,
        subdivision: null,
        region: formData.regionName || null,
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

  const validateField = (field: string, value: any) => {
    const testData = {
      ...formData,
      city: formData.cityName || formData.cityCode || '',
      province: formData.provinceName || formData.provinceCode || '',
      [field]: value,
    }

    const result = addressSchema.safeParse(testData)
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-3.5 gap-y-3 text-xs">
          <div className="sm:col-span-2">
            {renderField(
              'Street Address *',
              'street',
              <Input
                value={formData.street || ''}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                className="h-8 text-xs focus-visible:ring-teal-500"
                placeholder="House/Unit no., Building/Street name, Subdivision"
              />
            )}
          </div>

          {/* Region Dropdown */}
          {renderField(
            'Region',
            'region',
            <Select value={formData.regionCode || ''} onValueChange={handleRegionChange}>
              <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((reg) => (
                  <SelectItem key={reg.code || reg.id} value={reg.code || reg.id}>
                    {reg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Province Dropdown */}
          {renderField(
            'Province / State *',
            'province',
            <Select
              value={formData.provinceCode || ''}
              onValueChange={handleProvinceChange}
              disabled={loadingProvinces || (regions.length > 0 && !formData.regionCode)}
            >
              <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                {loadingProvinces ? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                ) : (
                  <SelectValue placeholder="Select Province" />
                )}
              </SelectTrigger>
              <SelectContent>
                {provinces.map((prov) => (
                  <SelectItem key={prov.code || prov.id} value={prov.code || prov.id}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* City / Municipality Dropdown */}
          {renderField(
            'City / Municipality *',
            'city',
            <Select
              value={formData.cityCode || ''}
              onValueChange={handleCityChange}
              disabled={loadingCities || (provinces.length > 0 && !formData.provinceCode)}
            >
              <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                {loadingCities ? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                ) : (
                  <SelectValue placeholder="Select City/Municipality" />
                )}
              </SelectTrigger>
              <SelectContent>
                {cities.map((cit) => (
                  <SelectItem key={cit.code || cit.id} value={cit.code || cit.id}>
                    {cit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Barangay Dropdown */}
          {renderField(
            'Barangay',
            'barangay',
            <Select
              value={formData.barangayCode || ''}
              onValueChange={handleBarangayChange}
              disabled={loadingBarangays || (cities.length > 0 && !formData.cityCode)}
            >
              <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                {loadingBarangays ? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                ) : (
                  <SelectValue placeholder="Select Barangay" />
                )}
              </SelectTrigger>
              <SelectContent>
                {barangays.map((brgy) => (
                  <SelectItem key={brgy.code || brgy.id} value={brgy.code || brgy.id}>
                    {brgy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Zip Code */}
          {renderField(
            'Zip Code',
            'zipCode',
            <Input
              value={formData.zipCode || ''}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              maxLength={4}
              className="h-8 text-xs focus-visible:ring-teal-500 font-mono"
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
          <Label htmlFor="addr-primary" className="text-xs font-semibold text-slate-700 dark:text-slate-350">
            Set as Primary Address
          </Label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveAddressId(null)}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isLoading ? 'Saving...' : 'Save Address'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
          No addresses recorded yet. Click "Add Address" below.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {addr.street || addr.addressLine || 'Address'}
                  </span>
                  {addr.isPrimary && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {[addr.barangay, addr.city, addr.state || addr.province, addr.region, addr.zipCode, addr.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartEdit(addr)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-teal-600"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(addr.id)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStartNew}
        className="w-full sm:w-auto h-8 text-xs font-semibold text-teal-600 border-teal-600/40 hover:bg-teal-50 dark:hover:bg-teal-950/20"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Address
      </Button>
    </div>
  )
}
