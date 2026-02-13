/**
 * Patient Dashboard V2 Type Definitions
 * 
 * Comprehensive types for modern patient dashboard based on Prisma schema.
 * Real data types derived from: Appointment, VitalSign, Prescription, ConsultationNote, Lab requests
 * 
 * NO MOCK DATA - All types map to actual database models
 */

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface DashboardAppointment {
  id: number
  caseNumber: string | null
  subject: string
  complaint: string | null

  // Appointment Attribute details
  date: Date | null
  timeStart: string | null
  timeEnd: string | null
  status: string // "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULED"
  recurring: boolean
  maxDuration: number
  meetingUrl: string | null

  // Doctor info
  doctor: {
    id: number
    firstName: string | null
    lastName: string | null
    specialization: string | null
    picture: string | null
  }

  // Clinic info
  clinic: {
    id: number
    name: string
    uid: string
  }

  // Mode info
  mode: {
    id: number
    name: string // "IN-PERSON" | "VIRTUAL" | etc
  }

  // Service info
  service: {
    id: number
    name: string
  }

  createdAt: Date
  updatedAt: Date
}

export interface NextAppointmentData {
  appointment: DashboardAppointment | null
  daysUntil: number | null
  hoursUntil: number | null
  isToday: boolean
  isUpcoming: boolean
  isPast: boolean
}

export interface UpcomingAppointmentsData {
  appointments: DashboardAppointment[]
  total: number
}

// ============================================================================
// VITAL SIGNS TYPES
// ============================================================================

export interface VitalSignRecord {
  id: number
  userId: number
  dateTaken: Date
  height: number | null
  weight: number | null
  bmi: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  pulseRate: number | null
  temp: number | null
  spo2: number | null
  respRate: number | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LatestVitalsData {
  vitals: VitalSignRecord | null
  previousVitals: VitalSignRecord | null
  trends: {
    bp: TrendIndicator | null
    hr: TrendIndicator | null
    temp: TrendIndicator | null
    weight: TrendIndicator | null
    spo2: TrendIndicator | null
  }
}

export interface VitalHistoryData {
  vitals: VitalSignRecord[]
  dateRange: {
    from: Date
    to: Date
  }
  averages: {
    bpSystolic: number | null
    bpDiastolic: number | null
    pulseRate: number | null
    temp: number | null
    weight: number | null
    spo2: number | null
  }
}

export interface TrendIndicator {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  change: number | null
  status: 'normal' | 'warning' | 'critical'
}

// ============================================================================
// PRESCRIPTION TYPES
// ============================================================================

export interface Medicine {
  id: number
  name: string
  brandName: string | null
  genericName: string | null
  dosage: string | null
  frequency: string | null
  unit: string | null
  duration: number
  qty: number | null
  notes: string | null
  isActive: boolean
}

export interface PrescriptionData {
  id: number
  serialNumber: string | null
  name: string | null
  subject: string | null
  status: string // "active" | "archived" | "expired" | "partial"
  isActive: boolean
  isArchived: boolean

  // Doctor info
  prescribedBy: {
    id: number
    firstName: string | null
    lastName: string | null
    specialization: string | null
  }

  // Clinic info
  clinic: {
    id: number
    name: string
  }

  // Medicines
  medicines: Medicine[]

  // Dates
  createdAt: Date
  updatedAt: Date
  dateArchived: Date | null

  // Transaction
  transactionNumber: string | null
  remarks: string | null
}

export interface ActivePrescriptionsData {
  prescriptions: PrescriptionData[]
  total: number
  lowRefillCount: number
}

// ============================================================================
// CONSULTATION TYPES
// ============================================================================

export interface ConsultationNoteData {
  id: number
  consultationTicketId: number
  section: string
  sectionLabel: string
  content: string
  showOnPatient: boolean

  // Doctor info
  doctor: {
    id: number
    firstName: string | null
    lastName: string | null
    specialization: string | null
  }

  createdAt: Date
  updatedAt: Date
}

export interface ConsultationSummary {
  ticketId: number
  subject: string | null
  caseNumber: string | null
  status: string

  // Recent notes
  notes: ConsultationNoteData[]

  // Doctor assigned
  doctors: {
    id: number
    firstName: string | null
    lastName: string | null
  }[]

  createdAt: Date
  updatedAt: Date
}

export interface RecentConsultationsData {
  consultations: ConsultationSummary[]
  total: number
}

// ============================================================================
// LAB REQUEST TYPES
// ============================================================================

export interface LaboratoryRequestData {
  id: number
  serialNumber: string
  consultationTicketId: number

  // Ordered by
  orderedBy: {
    id: number
    firstName: string | null
    lastName: string | null
    specialization: string | null
  }

  // At clinic
  clinic: {
    id: number
    name: string
  }

  status: 'pending' | 'completed' | 'cancelled'
  impression: string | null
  procedures: string[] // procedure names

  createdAt: Date
  updatedAt: Date
}

export interface PendingLabWorkData {
  requests: LaboratoryRequestData[]
  total: number
  pendingCount: number
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface PatientDashboardData {
  // Patient info
  patient: {
    id: number
    userId: string
    firstName: string | null
    lastName: string | null
    picture: string | null
    email: string
    dob: Date | null
    gender: string | null
  }

  // Next appointment
  nextAppointment: NextAppointmentData

  // Upcoming appointments (next 3)
  upcomingAppointments: UpcomingAppointmentsData

  // Latest vitals
  latestVitals: LatestVitalsData

  // Vital history (last 7 days)
  vitalHistory: VitalHistoryData

  // Active prescriptions
  prescriptions: ActivePrescriptionsData

  // Recent consultations
  recentConsultations: RecentConsultationsData

  // Pending lab work
  pendingLabWork: PendingLabWorkData

  // Metadata
  lastUpdated: Date
  dataCompleteness: {
    hasAppointments: boolean
    hasVitals: boolean
    hasPrescriptions: boolean
    hasConsultations: boolean
    hasLabRequests: boolean
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DashboardError {
  section: string
  message: string
  code: string
  timestamp: Date
}

export interface DashboardLoadingState {
  nextAppointment: boolean
  upcomingAppointments: boolean
  vitals: boolean
  prescriptions: boolean
  consultations: boolean
  labWork: boolean
}
