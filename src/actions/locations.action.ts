'use server'

import locationsData from '@/data/philippines-locations.json'
import type {
    PhilippineLocationsData,
    RegionOption,
    ProvinceOption,
    CityOption,
    BarangayOption,
} from '@/types/locations'

const data: PhilippineLocationsData = locationsData as PhilippineLocationsData

/**
 * Get all regions in the Philippines
 */
export async function getRegions(): Promise<RegionOption[]> {
    return data.regions.map((region) => ({
        id: region.code,
        name: region.name,
        code: region.code,
    }))
}

/**
 * Get provinces by region code
 */
export async function getProvincesByRegion(regionCode: string): Promise<ProvinceOption[]> {
    const region = data.regions.find((r) => r.code === regionCode)
    if (!region) {
        return []
    }
    return region.provinces.map((province) => ({
        id: province.code,
        name: province.name,
        code: province.code,
    }))
}

/**
 * Get cities and municipalities by province code
 */
export async function getCitiesByProvince(provinceCode: string): Promise<CityOption[]> {
    const provinces = data.regions.flatMap((region) => region.provinces)
    const province = provinces.find((p) => p.code === provinceCode)
    if (!province) {
        return []
    }
    const allCities = [...province.cities, ...province.municipalities]
    return allCities.map((city) => ({
        id: city.code,
        name: city.name,
        code: city.code,
    }))
}

/**
 * Get barangays by city code
 */
export async function getBarangaysByCity(cityCode: string): Promise<BarangayOption[]> {
    const allCities = data.regions.flatMap((region) =>
        region.provinces.flatMap((province) => [
            ...province.cities,
            ...province.municipalities,
        ])
    )
    const city = allCities.find((c) => c.code === cityCode)
    if (!city) {
        return []
    }
    return city.barangays.map((barangay) => ({
        id: barangay.code,
        name: barangay.name,
        code: barangay.code,
    }))
}

/**
 * Get city/municipality info by code
 */
export async function getCityInfo(cityCode: string): Promise<CityOption | null> {
    const allCities = data.regions.flatMap((region) =>
        region.provinces.flatMap((province) => [
            ...province.cities,
            ...province.municipalities,
        ])
    )
    const city = allCities.find((c) => c.code === cityCode)
    if (!city) {
        return null
    }
    return {
        id: city.code,
        name: city.name,
        code: city.code,
    }
}
