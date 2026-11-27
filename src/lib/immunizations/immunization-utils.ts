import { ImmunizationCategory } from '@prisma/client'

export interface VaccineDoseDef {
  doseNumber: number
  doseLabel: string
  code: string
  route: string
  description?: string
}

export interface VaccineFamilyDef {
  id: string
  name: string
  category: ImmunizationCategory
  description: string
  targetDoses: number
  scheduleDescription?: string
  doses: VaccineDoseDef[]
}

export const STANDARD_VACCINE_FAMILIES: VaccineFamilyDef[] = [
  // CHILD (<5y)
  {
    id: 'CHILD_BCG',
    name: 'BCG',
    category: ImmunizationCategory.CHILD,
    description: 'Bacillus Calmette-Guérin Vaccine (Tuberculosis)',
    targetDoses: 1,
    scheduleDescription: 'Given at birth',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C01', route: 'Intradermal', description: 'At birth' },
    ],
  },
  {
    id: 'CHILD_OPV',
    name: 'OPV',
    category: ImmunizationCategory.CHILD,
    description: 'Oral Polio Vaccine',
    targetDoses: 3,
    scheduleDescription: '3-dose primary series (6, 10, 14 weeks)',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C02', route: 'Oral', description: '6 weeks' },
      { doseNumber: 2, doseLabel: '2nd Dose', code: 'C03', route: 'Oral', description: '10 weeks' },
      { doseNumber: 3, doseLabel: '3rd Dose', code: 'C04', route: 'Oral', description: '14 weeks' },
    ],
  },
  {
    id: 'CHILD_DPT',
    name: 'DPT',
    category: ImmunizationCategory.CHILD,
    description: 'Diphtheria, Pertussis, Tetanus Vaccine',
    targetDoses: 3,
    scheduleDescription: '3-dose primary series (6, 10, 14 weeks)',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C05', route: 'Intramuscular', description: '6 weeks' },
      { doseNumber: 2, doseLabel: '2nd Dose', code: 'C06', route: 'Intramuscular', description: '10 weeks' },
      { doseNumber: 3, doseLabel: '3rd Dose', code: 'C07', route: 'Intramuscular', description: '14 weeks' },
    ],
  },
  {
    id: 'CHILD_HEPB',
    name: 'Hepatitis B',
    category: ImmunizationCategory.CHILD,
    description: 'Hepatitis B Vaccine',
    targetDoses: 3,
    scheduleDescription: 'Birth, 6 weeks, 14 weeks',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C09', route: 'Intramuscular', description: 'Within 24 hours of birth' },
      { doseNumber: 2, doseLabel: '2nd Dose', code: 'C10', route: 'Intramuscular', description: '6 weeks' },
      { doseNumber: 3, doseLabel: '3rd Dose', code: 'C11', route: 'Intramuscular', description: '14 weeks' },
    ],
  },
  {
    id: 'CHILD_MEASLES',
    name: 'Measles',
    category: ImmunizationCategory.CHILD,
    description: 'Measles Vaccine',
    targetDoses: 1,
    scheduleDescription: 'Given at 9 months',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C08', route: 'Subcutaneous', description: '9 months' },
    ],
  },
  {
    id: 'CHILD_HEPA',
    name: 'Hepatitis A',
    category: ImmunizationCategory.CHILD,
    description: 'Hepatitis A Vaccine',
    targetDoses: 1,
    scheduleDescription: 'Given at 12 months & above',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C12', route: 'Intramuscular', description: '12 months+' },
    ],
  },
  {
    id: 'CHILD_VARICELLA',
    name: 'Varicella',
    category: ImmunizationCategory.CHILD,
    description: 'Chicken Pox Vaccine',
    targetDoses: 1,
    scheduleDescription: 'Given at 12-15 months',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'C13', route: 'Subcutaneous', description: '12-15 months' },
    ],
  },

  // YOUNG WOMAN (10-49y)
  {
    id: 'YW_HPV',
    name: 'HPV',
    category: ImmunizationCategory.YOUNG_WOMAN,
    description: 'Human Papillomavirus Vaccine (Cervical Cancer prevention)',
    targetDoses: 1,
    scheduleDescription: 'Ages 9-14: 2 doses; Ages 15+: 3 doses',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'Y01', route: 'Intramuscular', description: 'Primary dose' },
    ],
  },
  {
    id: 'YW_MMR',
    name: 'MMR',
    category: ImmunizationCategory.YOUNG_WOMAN,
    description: 'Measles, Mumps, Rubella Vaccine',
    targetDoses: 1,
    scheduleDescription: 'Women of childbearing age without prior immunity',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'Y02', route: 'Subcutaneous', description: 'Primary dose' },
    ],
  },

  // PREGNANT WOMAN
  {
    id: 'PREG_TT',
    name: 'Tetanus Toxoid',
    category: ImmunizationCategory.PREGNANT,
    description: 'Tetanus Toxoid Vaccine (Maternal & Neonatal Tetanus protection)',
    targetDoses: 1,
    scheduleDescription: 'Administered during antenatal care visits',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'P01', route: 'Intramuscular', description: 'Antenatal dose' },
    ],
  },

  // ELDERLY (≥60y)
  {
    id: 'ELD_PNEUMO',
    name: 'Pneumococcal Vaccine',
    category: ImmunizationCategory.ELDERLY,
    description: 'Pneumococcal Polysaccharide Vaccine (PPV23 / PCV13)',
    targetDoses: 1,
    scheduleDescription: 'Single primary dose for seniors ≥60 years',
    doses: [
      { doseNumber: 1, doseLabel: '1st Dose', code: 'E01', route: 'Intramuscular', description: 'Senior dose' },
    ],
  },
  {
    id: 'ELD_FLU',
    name: 'Flu Vaccine',
    category: ImmunizationCategory.ELDERLY,
    description: 'Influenza Vaccine (Seasonal)',
    targetDoses: 1,
    scheduleDescription: 'Recommended annually for seniors',
    doses: [
      { doseNumber: 1, doseLabel: 'Annual Dose', code: 'E02', route: 'Intramuscular', description: 'Annual seasonal shot' },
    ],
  },
]

export const CATEGORY_METADATA: Record<
  ImmunizationCategory,
  {
    label: string
    shortLabel: string
    emoji: string
    ageCriteria: string
    description: string
  }
> = {
  CHILD: {
    label: 'Child (<5 years)',
    shortLabel: 'Child',
    emoji: '👶',
    ageCriteria: '0 – 59 months old',
    description: 'EPI Primary Series (BCG, OPV, DPT, Hepatitis B, Measles)',
  },
  YOUNG_WOMAN: {
    label: 'Young Woman (10–49y)',
    shortLabel: 'Young Woman',
    emoji: '👩',
    ageCriteria: 'Female, 10 – 49 years old',
    description: 'HPV and MMR immunization programs',
  },
  PREGNANT: {
    label: 'Pregnant Woman',
    shortLabel: 'Pregnant',
    emoji: '🤰',
    ageCriteria: 'Expectant mothers during antenatal care',
    description: 'Tetanus Toxoid maternal immunization',
  },
  ELDERLY: {
    label: 'Elderly (≥60 years)',
    shortLabel: 'Elderly',
    emoji: '👴',
    ageCriteria: '60 years old and above',
    description: 'Pneumococcal and annual influenza vaccines',
  },
  OTHER: {
    label: 'Other / Custom Vaccine',
    shortLabel: 'Other / Custom',
    emoji: '💉',
    ageCriteria: 'All age groups & custom protocols',
    description: 'COVID-19, Rabies, Travel, and general vaccinations',
  },
}

/**
 * Automatically detects recommended PhilHealth demographic immunization category.
 */
export function detectRecommendedCategory({
  dob,
  age,
  gender,
  isPregnant,
}: {
  dob?: string | Date | null
  age?: number | null
  gender?: string | null
  isPregnant?: boolean | null
}): ImmunizationCategory {
  if (isPregnant) {
    return ImmunizationCategory.PREGNANT
  }

  let ageMonths: number | null = null

  if (dob) {
    const birthDate = new Date(dob)
    if (!isNaN(birthDate.getTime())) {
      const now = new Date()
      let months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth())
      if (now.getDate() < birthDate.getDate()) {
        months--
      }
      ageMonths = Math.max(0, months)
    }
  }

  if (ageMonths === null && typeof age === 'number' && !isNaN(age)) {
    ageMonths = Math.max(0, Math.round(age * 12))
  }

  const normalizedGender = (gender || '').trim().toUpperCase()
  const isFemale = normalizedGender === 'FEMALE' || normalizedGender === 'F'

  if (ageMonths !== null) {
    // Child: < 5 years (0 - 59 months)
    if (ageMonths < 60) {
      return ImmunizationCategory.CHILD
    }
    // Elderly: >= 60 years (720 months+)
    if (ageMonths >= 720) {
      return ImmunizationCategory.ELDERLY
    }
    // Young woman: Female, 10 - 49 years (120 - 588 months)
    if (isFemale && ageMonths >= 120 && ageMonths < 600) {
      return ImmunizationCategory.YOUNG_WOMAN
    }
    // Adult outside young-woman or male adult
    return ImmunizationCategory.OTHER
  }

  if (isFemale) {
    return ImmunizationCategory.YOUNG_WOMAN
  }

  return ImmunizationCategory.CHILD
}

export interface GroupedVaccinationRecord {
  id: number
  vaccine: string
  dose: string
  route: string
  dateGiven: string
  administeredBy?: string | null
  facilityName?: string | null
  notes?: string | null
  category?: string | null
  code?: string | null
}

export interface StandardSeriesStatus {
  family: VaccineFamilyDef
  administeredDoses: GroupedVaccinationRecord[]
  nextPendingDose: VaccineDoseDef | null
  completedCount: number
  targetCount: number
  isComplete: boolean
  progressPercent: number
}

/**
 * Normalize strings for fuzzy matching vaccine names
 */
function cleanName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Organizes patient's vaccination records into standard multi-dose series, custom vaccines,
 * and official PhilHealth Code 999 ("None Given") declarations.
 */
export function groupVaccinationsByFamily(
  records: any[] = [],
  activeCategory?: ImmunizationCategory
) {
  const noneRecords: GroupedVaccinationRecord[] = []
  const customRecords: GroupedVaccinationRecord[] = []
  const matchedRecordIds = new Set<number>()

  // Normalize records
  const allRecords: GroupedVaccinationRecord[] = records.map((r) => ({
    id: r.id,
    vaccine: r.vaccine || r.vaccineName || 'Unspecified',
    dose: r.dose || r.doseNumber || '1st Dose',
    route: r.route || 'N/A',
    dateGiven: r.dateGiven instanceof Date ? r.dateGiven.toISOString() : String(r.dateGiven || ''),
    administeredBy: r.administeredBy,
    facilityName: r.facilityName,
    notes: r.notes,
    category: r.category,
    code: r.code,
  }))

  // 1. Separate PhilHealth Code 999 ("None Given") records
  for (const rec of allRecords) {
    if (rec.code === '999' || cleanName(rec.vaccine) === 'none') {
      noneRecords.push(rec)
      matchedRecordIds.add(rec.id)
    }
  }

  // 2. Filter families by category if requested, or include all relevant families
  const familiesToEvaluate = activeCategory && activeCategory !== ImmunizationCategory.OTHER
    ? STANDARD_VACCINE_FAMILIES.filter((f) => f.category === activeCategory)
    : STANDARD_VACCINE_FAMILIES

  // 3. Match records into standard series
  const standardSeriesList: StandardSeriesStatus[] = familiesToEvaluate.map((family) => {
    const administered: GroupedVaccinationRecord[] = []

    for (const rec of allRecords) {
      if (matchedRecordIds.has(rec.id)) continue

      // Match by exact PhilHealth Code first
      const hasCodeMatch = family.doses.some((d) => d.code === rec.code)
      if (hasCodeMatch) {
        administered.push(rec)
        matchedRecordIds.add(rec.id)
        continue
      }

      // Match by vaccine name similarity
      const cleanedFamilyName = cleanName(family.name)
      const cleanedRecName = cleanName(rec.vaccine)
      const isNameMatch =
        cleanedRecName.includes(cleanedFamilyName) ||
        cleanedFamilyName.includes(cleanedRecName) ||
        (family.id === 'CHILD_OPV' && (cleanedRecName.includes('polio') || cleanedRecName.includes('opv'))) ||
        (family.id === 'CHILD_DPT' && (cleanedRecName.includes('dpt') || cleanedRecName.includes('diphtheria') || cleanedRecName.includes('pertussis') || cleanedRecName.includes('tetanus'))) ||
        (family.id === 'CHILD_HEPB' && (cleanedRecName.includes('hepb') || cleanedRecName.includes('hepatitisb'))) ||
        (family.id === 'CHILD_HEPA' && (cleanedRecName.includes('hepa') || cleanedRecName.includes('hepatitisa'))) ||
        (family.id === 'CHILD_VARICELLA' && (cleanedRecName.includes('varicella') || cleanedRecName.includes('chickenpox'))) ||
        (family.id === 'ELD_FLU' && (cleanedRecName.includes('flu') || cleanedRecName.includes('influenza'))) ||
        (family.id === 'ELD_PNEUMO' && (cleanedRecName.includes('pneumo') || cleanedRecName.includes('ppv23') || cleanedRecName.includes('pcv13')))

      if (isNameMatch && (!rec.category || rec.category === family.category || rec.category === ImmunizationCategory.OTHER)) {
        administered.push(rec)
        matchedRecordIds.add(rec.id)
      }
    }

    // Sort administered doses by doseNumber or date
    administered.sort((a, b) => {
      const dateA = new Date(a.dateGiven).getTime()
      const dateB = new Date(b.dateGiven).getTime()
      return dateA - dateB
    })

    const completedCount = administered.length
    const targetCount = family.targetDoses
    const isComplete = completedCount >= targetCount

    // Find next pending dose from family.doses definition
    let nextPendingDose: VaccineDoseDef | null = null
    if (!isComplete) {
      // Find the first dose definition not yet fulfilled
      for (let i = 0; i < family.doses.length; i++) {
        const doseDef = family.doses[i]
        const alreadyAdministered = administered.some(
          (adm) =>
            adm.code === doseDef.code ||
            adm.dose.toLowerCase().includes(`${doseDef.doseNumber}`) ||
            (doseDef.doseNumber === 1 && adm.dose.toLowerCase().includes('1st')) ||
            (doseDef.doseNumber === 2 && adm.dose.toLowerCase().includes('2nd')) ||
            (doseDef.doseNumber === 3 && adm.dose.toLowerCase().includes('3rd'))
        )
        if (!alreadyAdministered) {
          nextPendingDose = doseDef
          break
        }
      }
      if (!nextPendingDose && family.doses.length > 0) {
        nextPendingDose = family.doses[Math.min(completedCount, family.doses.length - 1)]
      }
    }

    const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100))

    return {
      family,
      administeredDoses: administered,
      nextPendingDose,
      completedCount,
      targetCount,
      isComplete,
      progressPercent,
    }
  })

  // 4. Remaining unmatched records go to custom/other
  for (const rec of allRecords) {
    if (!matchedRecordIds.has(rec.id)) {
      customRecords.push(rec)
    }
  }

  return {
    standardSeriesList,
    customRecords,
    noneRecords,
    allRecords,
  }
}
