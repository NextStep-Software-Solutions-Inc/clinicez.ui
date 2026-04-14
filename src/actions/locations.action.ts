'use server'

import prisma from '@lib/prisma'
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
 * Get all regions in the Philippines.
 * Reads from the DB (active records only) when the tables have been seeded;
 * falls back to the bundled static JSON before first seed.
 */
export async function getRegions(): Promise<RegionOption[]> {
    const dbRegions = await prisma.phRegion.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
    })

    if (dbRegions.length > 0) {
        return dbRegions.map((r) => ({ id: r.code, name: r.name, code: r.code }))
    }

    // Fallback: DB not yet seeded — use bundled JSON
    return data.regions.map((region) => ({
        id: region.code,
        name: region.name,
        code: region.code,
    }))
}

/**
 * Get provinces by region code.
 * DB-first with JSON fallback (see getRegions).
 */
export async function getProvincesByRegion(regionCode: string): Promise<ProvinceOption[]> {
    const dbProvinces = await prisma.phProvince.findMany({
        where: { regionCode, isActive: true },
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
    })

    if (dbProvinces.length > 0) {
        return dbProvinces.map((p) => ({ id: p.code, name: p.name, code: p.code }))
    }

    // Fallback
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
 * Get cities and municipalities by province code.
 * DB-first with JSON fallback (see getRegions).
 */
export async function getCitiesByProvince(provinceCode: string): Promise<CityOption[]> {
    const dbMunicipalities = await prisma.phMunicipality.findMany({
        where: { provinceCode, isActive: true },
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
    })

    if (dbMunicipalities.length > 0) {
        return dbMunicipalities.map((m) => ({ id: m.code, name: m.name, code: m.code }))
    }

    // Fallback
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
 * Get barangays by city/municipality code.
 * DB-first with JSON fallback (see getRegions).
 */
export async function getBarangaysByCity(cityCode: string): Promise<BarangayOption[]> {
    const dbBarangays = await prisma.phBarangay.findMany({
        where: { municipalityCode: cityCode, isActive: true },
        orderBy: { name: 'asc' },
        select: { code: true, name: true },
    })

    if (dbBarangays.length > 0) {
        return dbBarangays.map((b) => ({ id: b.code, name: b.name, code: b.code }))
    }

    // Fallback
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
 * Get city/municipality info by code.
 * DB-first with JSON fallback (see getRegions).
 * Consistent with other public location functions: inactive entries are not returned.
 */
export async function getCityInfo(cityCode: string): Promise<CityOption | null> {
    const dbMunicipality = await prisma.phMunicipality.findUnique({
        where: { code: cityCode },
        select: { code: true, name: true, isActive: true },
    })

    if (dbMunicipality) {
        // Record found in DB — honour isActive so deactivated entries are not surfaced
        if (!dbMunicipality.isActive) return null
        return { id: dbMunicipality.code, name: dbMunicipality.name, code: dbMunicipality.code }
    }

    // Fallback: DB not yet seeded — use bundled JSON
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
