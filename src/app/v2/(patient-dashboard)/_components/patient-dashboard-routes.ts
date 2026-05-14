export const APP_ROOT_PATH = '/'
export const PATIENT_DASHBOARD_HOME_PATH = '/v2/patient'
export const PATIENT_DASHBOARD_APPOINTMENTS_PATH = '/v2/appointments-consultations'
export const PATIENT_DASHBOARD_PROFILE_PATH = '/v2/profile'
export const PATIENT_DASHBOARD_FILES_PATH = '/v2/patient/files'
export const PATIENT_DASHBOARD_INTEGRATIONS_PATH = '/v2/integrations'
export const PATIENT_DASHBOARD_PROFILE_EDIT_PATH = '/v2/profile/edit'
export const PATIENT_DASHBOARD_PROFILE_VERIFICATION_PATH = '/v2/profile/verification'
export const PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH = '/v2/book-appointment'

export type PatientDashboardNavHref =
  | typeof PATIENT_DASHBOARD_HOME_PATH
  | typeof PATIENT_DASHBOARD_APPOINTMENTS_PATH
  | typeof PATIENT_DASHBOARD_PROFILE_PATH
  | typeof PATIENT_DASHBOARD_FILES_PATH

export interface PatientDashboardNavItem {
  href: PatientDashboardNavHref
  label: string
  mobileLabel?: string
}

export const PATIENT_DASHBOARD_NAV_ITEMS: PatientDashboardNavItem[] = [
  { href: PATIENT_DASHBOARD_HOME_PATH, label: 'Home' },
  { href: PATIENT_DASHBOARD_APPOINTMENTS_PATH, label: 'Appointments' },
  { href: PATIENT_DASHBOARD_PROFILE_PATH, label: 'Health Records', mobileLabel: 'Profile' },
  { href: PATIENT_DASHBOARD_FILES_PATH, label: 'Files' },
]

const PATIENT_DASHBOARD_PAGE_TITLE_MAP: Record<string, string> = {
  [PATIENT_DASHBOARD_HOME_PATH]: '',
  [PATIENT_DASHBOARD_APPOINTMENTS_PATH]: 'My Appointments',
  [PATIENT_DASHBOARD_FILES_PATH]: 'My Files',
  [PATIENT_DASHBOARD_INTEGRATIONS_PATH]: 'Integrations',
  [PATIENT_DASHBOARD_PROFILE_PATH]: 'Health Records',
  [PATIENT_DASHBOARD_PROFILE_EDIT_PATH]: 'Edit Profile',
  [PATIENT_DASHBOARD_PROFILE_VERIFICATION_PATH]: 'Verification',
  [PATIENT_DASHBOARD_BOOK_APPOINTMENT_PATH]: 'Book Appointment',
}

export function isPatientDashboardRouteActive(pathname: string, href: string): boolean {
  if (href === PATIENT_DASHBOARD_HOME_PATH) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getPatientDashboardPageTitle(pathname: string): string {
  if (PATIENT_DASHBOARD_PAGE_TITLE_MAP[pathname] !== undefined) {
    return PATIENT_DASHBOARD_PAGE_TITLE_MAP[pathname]
  }

  for (const [path, title] of Object.entries(PATIENT_DASHBOARD_PAGE_TITLE_MAP)) {
    if (path !== PATIENT_DASHBOARD_HOME_PATH && isPatientDashboardRouteActive(pathname, path)) {
      return title
    }
  }

  return ''
}
