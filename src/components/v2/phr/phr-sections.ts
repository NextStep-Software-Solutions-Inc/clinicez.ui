export const PHR_SECTIONS = [
  { id: 'demographics', label: 'Demographics' },
  { id: 'vitals', label: 'Vital Signs' },
  { id: 'medical', label: 'Medical History' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'vaccinations', label: 'Vaccinations' },
  { id: 'disabilities', label: 'Disabilities' },
  { id: 'contacts', label: 'Emergency Contacts' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'lifestyle', label: 'Lifestyle & Social History' },
  { id: 'obgyn', label: 'OB/GYN History' },
  { id: 'pediatric', label: 'Pediatric Measurements' },
  { id: 'exams', label: 'Physical Examinations' },
  { id: 'insurance', label: 'Insurance & Documents' },
] as const

export type PHRSectionId = (typeof PHR_SECTIONS)[number]['id']

/** 'colorful' = full ClinicEZ teal branding; 'minimal' = monochrome / low-ink professional */
export type PHRTheme = 'colorful' | 'minimal'
