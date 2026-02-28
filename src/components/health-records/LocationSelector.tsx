'use client'

import React, { useState, useEffect } from 'react'
import {
  getRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
  getCityInfo,
} from '@/actions/locations.action'
import type { RegionOption, ProvinceOption, CityOption, BarangayOption } from '@/types/locations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from './index'

interface LocationSelectorProps {
  region?: string
  province?: string
  city?: string
  barangay?: string
  onRegionChange?: (regionData: { code: string; name: string }) => void
  onProvinceChange?: (provinceData: { code: string; name: string }) => void
  onCityChange?: (cityData: { code: string; name: string }) => void
  onBarangayChange?: (barangayData: { code: string; name: string }) => void
  disabled?: boolean
}

export function LocationSelector({
  region = '',
  province = '',
  city = '',
  barangay = '',
  onRegionChange,
  onProvinceChange,
  onCityChange,
  onBarangayChange,
  disabled = false,
}: LocationSelectorProps) {
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [barangays, setBarangays] = useState<BarangayOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      const data = await getRegions()
      setRegions(data)
    }
    loadRegions()
  }, [])

  // Load provinces when region changes
  useEffect(() => {
    if (!region) {
      setProvinces([])
      setCities([])
      setBarangays([])
      return
    }

    const loadProvinces = async () => {
      setIsLoading(true)
      const data = await getProvincesByRegion(region)
      setProvinces(data)
      setCities([])
      setBarangays([])
      setIsLoading(false)
    }
    loadProvinces()
  }, [region])

  // Load cities when province changes
  useEffect(() => {
    if (!province) {
      setCities([])
      setBarangays([])
      return
    }

    const loadCities = async () => {
      setIsLoading(true)
      const data = await getCitiesByProvince(province)
      setCities(data)
      setBarangays([])
      setIsLoading(false)
    }
    loadCities()
  }, [province])

  // Load barangays and update zip code when city changes
  useEffect(() => {
    if (!city) {
      setBarangays([])
      return
    }

    const loadBarangays = async () => {
      setIsLoading(true)
      try {
        const barangayData = await getBarangaysByCity(city)
        setBarangays(barangayData)
        // Note: PSGC API does not provide postal code data
        // Users should fill ZIP code manually or use a separate postal code database
      } finally {
        setIsLoading(false)
      }
    }
    loadBarangays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  const handleRegionChange = (value: string) => {
    const selectedRegion = regions.find((r) => r.id === value)
    if (selectedRegion) {
      onRegionChange?.({ code: selectedRegion.id, name: selectedRegion.name })
    }
  }

  const handleProvinceChange = (value: string) => {
    const selectedProvince = provinces.find((p) => p.id === value)
    if (selectedProvince) {
      onProvinceChange?.({ code: selectedProvince.id, name: selectedProvince.name })
    }
  }

  const handleCityChange = (value: string) => {
    const selectedCity = cities.find((c) => c.id === value)
    if (selectedCity) {
      onCityChange?.({ code: selectedCity.id, name: selectedCity.name })
    }
  }

  const handleBarangayChange = (value: string) => {
    const selectedBarangay = barangays.find((b) => b.id === value)
    if (selectedBarangay) {
      onBarangayChange?.({ code: selectedBarangay.id, name: selectedBarangay.name })
    }
  }

  return (
    <div className="space-y-4">
      {/* Region */}
      <FormField label="Region" required htmlFor="region">
        <Select value={region} onValueChange={handleRegionChange} disabled={disabled}>
          <SelectTrigger id="region">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Province */}
      <FormField label="State/Province" required htmlFor="province">
        <Select
          value={province}
          onValueChange={handleProvinceChange}
          disabled={disabled || !region || isLoading}
        >
          <SelectTrigger id="province">
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* City */}
      <FormField label="City" required htmlFor="city">
        <Select
          value={city}
          onValueChange={handleCityChange}
          disabled={disabled || !province || isLoading}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Barangay */}
      <FormField label="Barangay" htmlFor="barangay">
        <Select
          value={barangay}
          onValueChange={handleBarangayChange}
          disabled={disabled || !city || isLoading}
        >
          <SelectTrigger id="barangay">
            <SelectValue placeholder="Select barangay" />
          </SelectTrigger>
          <SelectContent>
            {barangays.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}
