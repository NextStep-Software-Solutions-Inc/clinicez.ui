/**
 * Pediatric Growth Utilities
 * WHO Growth Standards and percentile calculations for pediatric measurements
 */

/**
 * Calculate age in months from DOB and reference date
 */
export const calculateAgeInMonths = (dob: Date, referenceDate: Date = new Date()): number => {
  const dobDate = new Date(dob)
  const refDate = new Date(referenceDate)
  
  let months = refDate.getMonth() - dobDate.getMonth()
  let years = refDate.getFullYear() - dobDate.getFullYear()
  
  months += years * 12
  
  if (refDate.getDate() < dobDate.getDate()) {
    months -= 1
  }
  
  return Math.max(0, months)
}

/**
 * Calculate age in years from DOB and reference date
 */
export const calculateAgeInYears = (dob: Date, referenceDate: Date = new Date()): number => {
  const months = calculateAgeInMonths(dob, referenceDate)
  return Math.floor(months / 12)
}

/**
 * Format age for display (e.g., "2 years 3 months" or "15 months")
 */
export const formatAge = (dob: Date, referenceDate: Date = new Date()): string => {
  const months = calculateAgeInMonths(dob, referenceDate)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  
  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
}

/**
 * WHO Growth Standards for Length/Height by age
 * Based on WHO Child Growth Standards (0-5 years) and growth references (5-19 years)
 * Returns length/height in cm for given age in months and percentile (male/female)
 * 
 * Format: {ageMonths: {male: {p3, p15, p50, p85, p97}, female: {p3, p15, p50, p85, p97}}}
 */
const WHO_LENGTH_STANDARDS: Record<number, Record<string, Record<string, number>>> = {
  0: { male: { p3: 45.3, p15: 47.1, p50: 49.9, p85: 52.7, p97: 54.5 }, female: { p3: 44.5, p15: 46.3, p50: 49.1, p85: 51.9, p97: 53.8 } },
  3: { male: { p3: 54.4, p15: 56.5, p50: 59.6, p85: 62.7, p97: 64.7 }, female: { p3: 52.8, p15: 54.8, p50: 57.8, p85: 60.8, p97: 62.9 } },
  6: { male: { p3: 61.0, p15: 63.3, p50: 66.8, p85: 70.3, p97: 72.5 }, female: { p3: 59.2, p15: 61.4, p50: 64.8, p85: 68.2, p97: 70.4 } },
  9: { male: { p3: 66.0, p15: 68.4, p50: 71.9, p85: 75.5, p97: 77.7 }, female: { p3: 63.9, p15: 66.3, p50: 69.8, p85: 73.3, p97: 75.5 } },
  12: { male: { p3: 69.5, p15: 72.0, p50: 75.6, p85: 79.2, p97: 81.4 }, female: { p3: 67.6, p15: 70.1, p50: 73.7, p85: 77.3, p97: 79.5 } },
  18: { male: { p3: 75.5, p15: 78.1, p50: 81.9, p85: 85.6, p97: 88.0 }, female: { p3: 73.3, p15: 75.9, p50: 79.7, p85: 83.5, p97: 85.8 } },
  24: { male: { p3: 79.8, p15: 82.6, p50: 86.6, p85: 90.6, p97: 93.1 }, female: { p3: 77.3, p15: 80.1, p50: 84.1, p85: 88.2, p97: 90.6 } },
  36: { male: { p3: 87.3, p15: 90.3, p50: 94.9, p85: 99.6, p97: 102.3 }, female: { p3: 85.3, p15: 88.2, p50: 92.7, p85: 97.3, p97: 100.0 } },
  48: { male: { p3: 93.6, p15: 96.8, p50: 101.8, p85: 106.9, p97: 109.8 }, female: { p3: 91.6, p15: 94.8, p50: 99.8, p85: 104.9, p97: 107.8 } },
  60: { male: { p3: 99.2, p15: 102.5, p50: 107.9, p85: 113.2, p97: 116.3 }, female: { p3: 97.5, p15: 100.7, p50: 106.0, p85: 111.3, p97: 114.3 } },
}

/**
 * WHO Growth Standards for Weight by age
 * Returns weight in kg for given age in months and percentile (male/female)
 */
const WHO_WEIGHT_STANDARDS: Record<number, Record<string, Record<string, number>>> = {
  0: { male: { p3: 2.5, p15: 2.9, p50: 3.5, p85: 4.1, p97: 4.6 }, female: { p3: 2.3, p15: 2.7, p50: 3.2, p85: 3.8, p97: 4.3 } },
  3: { male: { p3: 4.4, p15: 4.9, p50: 5.8, p85: 6.7, p97: 7.3 }, female: { p3: 4.0, p15: 4.5, p50: 5.3, p85: 6.1, p97: 6.7 } },
  6: { male: { p3: 5.7, p15: 6.4, p50: 7.6, p85: 8.8, p97: 9.7 }, female: { p3: 5.1, p15: 5.8, p50: 6.9, p85: 8.0, p97: 8.8 } },
  9: { male: { p3: 6.8, p15: 7.6, p50: 9.0, p85: 10.4, p97: 11.4 }, female: { p3: 6.1, p15: 6.9, p50: 8.2, p85: 9.5, p97: 10.4 } },
  12: { male: { p3: 7.5, p15: 8.4, p50: 9.9, p85: 11.5, p97: 12.6 }, female: { p3: 6.8, p15: 7.7, p50: 9.1, p85: 10.6, p97: 11.6 } },
  18: { male: { p3: 8.8, p15: 9.9, p50: 11.7, p85: 13.5, p97: 14.8 }, female: { p3: 8.0, p15: 9.0, p50: 10.7, p85: 12.4, p97: 13.6 } },
  24: { male: { p3: 9.9, p15: 11.1, p50: 13.2, p85: 15.4, p97: 16.8 }, female: { p3: 9.1, p15: 10.3, p50: 12.3, p85: 14.3, p97: 15.6 } },
  36: { male: { p3: 11.5, p15: 13.0, p50: 15.3, p85: 17.7, p97: 19.3 }, female: { p3: 10.7, p15: 12.1, p50: 14.3, p85: 16.5, p97: 18.0 } },
  48: { male: { p3: 13.3, p15: 15.0, p50: 17.7, p85: 20.4, p97: 22.2 }, female: { p3: 12.3, p15: 14.0, p50: 16.5, p85: 19.0, p97: 20.8 } },
  60: { male: { p3: 15.0, p15: 17.0, p50: 20.0, p85: 23.1, p97: 25.2 }, female: { p3: 14.0, p15: 15.9, p50: 18.6, p85: 21.4, p97: 23.5 } },
}

/**
 * Get WHO percentile for length/height
 * Returns the percentile status: '3rd', '15th', '50th', '85th', '97th', or 'custom'
 */
export const getLengthPercentile = (
  ageMonths: number,
  length: number,
  gender: 'MALE' | 'FEMALE'
): { percentile: string; status: 'normal' | 'warning' | 'concern' } => {
  // Find closest age group
  const ageGroups = Object.keys(WHO_LENGTH_STANDARDS).map(Number).sort((a, b) => a - b)
  let reference = WHO_LENGTH_STANDARDS[60] // Default to 5 years
  
  if (ageMonths <= 60) {
    for (let i = 0; i < ageGroups.length; i++) {
      if (ageMonths <= ageGroups[i]) {
        reference = WHO_LENGTH_STANDARDS[ageGroups[i]]
        break
      }
    }
  }
  
  const genderKey = gender === 'MALE' ? 'male' : 'female'
  const standards = reference[genderKey]
  
  if (length < standards.p3) return { percentile: '<3rd', status: 'concern' }
  if (length < standards.p15) return { percentile: '3rd-15th', status: 'warning' }
  if (length < standards.p50) return { percentile: '15th-50th', status: 'normal' }
  if (length < standards.p85) return { percentile: '50th-85th', status: 'normal' }
  if (length < standards.p97) return { percentile: '85th-97th', status: 'normal' }
  
  return { percentile: '>97th', status: 'warning' }
}

/**
 * Get WHO percentile for weight
 */
export const getWeightPercentile = (
  ageMonths: number,
  weight: number,
  gender: 'MALE' | 'FEMALE'
): { percentile: string; status: 'normal' | 'warning' | 'concern' } => {
  // Find closest age group
  const ageGroups = Object.keys(WHO_WEIGHT_STANDARDS).map(Number).sort((a, b) => a - b)
  let reference = WHO_WEIGHT_STANDARDS[60] // Default to 5 years
  
  if (ageMonths <= 60) {
    for (let i = 0; i < ageGroups.length; i++) {
      if (ageMonths <= ageGroups[i]) {
        reference = WHO_WEIGHT_STANDARDS[ageGroups[i]]
        break
      }
    }
  }
  
  const genderKey = gender === 'MALE' ? 'male' : 'female'
  const standards = reference[genderKey]
  
  if (weight < standards.p3) return { percentile: '<3rd', status: 'concern' }
  if (weight < standards.p15) return { percentile: '3rd-15th', status: 'warning' }
  if (weight < standards.p50) return { percentile: '15th-50th', status: 'normal' }
  if (weight < standards.p85) return { percentile: '50th-85th', status: 'normal' }
  if (weight < standards.p97) return { percentile: '85th-97th', status: 'normal' }
  
  return { percentile: '>97th', status: 'warning' }
}

/**
 * Get growth status color based on percentile status
 */
export const getGrowthStatusColor = (status: 'normal' | 'warning' | 'concern'): string => {
  switch (status) {
    case 'normal':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-700 dark:text-amber-300'
    case 'concern':
      return 'text-red-700 dark:text-red-300'
  }
}

/**
 * Get growth status badge background color
 */
export const getGrowthStatusBgColor = (status: 'normal' | 'warning' | 'concern'): string => {
  switch (status) {
    case 'normal':
      return 'bg-emerald-50 dark:bg-emerald-950/20'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/20'
    case 'concern':
      return 'bg-red-50 dark:bg-red-950/20'
  }
}
