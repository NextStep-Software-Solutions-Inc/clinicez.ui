/**
 * Philippine Locations Type Definitions
 * Based on PSGC API (https://psgc.gitlab.io/api/)
 */

export interface PhilippineBarangay {
    code: string
    name: string
}

export interface PhilippineCity {
    code: string
    name: string
    isCapital: boolean
    barangays: PhilippineBarangay[]
}

export interface PhilippineProvince {
    code: string
    name: string
    cities: PhilippineCity[]
    municipalities: PhilippineCity[]
}

export interface PhilippineRegion {
    code: string
    name: string
    regionName: string
    provinces: PhilippineProvince[]
}

export interface PhilippineLocationsData {
    regions: PhilippineRegion[]
}

// Flattened types for convenience
export interface LocationOption {
    id: string
    name: string
    code?: string
}

export type BarangayOption = LocationOption
export type CityOption = LocationOption & { zipCode?: string }
export type ProvinceOption = LocationOption
export type RegionOption = LocationOption
