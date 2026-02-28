/**
 * Patient Dashboard Type Definitions
 * 
 * Comprehensive types for patient dashboard components, derived from Prisma schema.
 * This file serves as the single source of truth for dashboard data structures.
 * 
 * @generated from prisma/schema.prisma models:
 * - Appointment, AppointmentAttribute, HealthcareProvider
 * - Prescription, Medicine
 * - PhysicalExamination, PediatricMeasurement
 * - ConsultationNote, ConsultationTicket
 * - User, Clinic
 */

// ============================================================================
// UPCOMING APPOINTMENTS TYPES
// ============================================================================

/**
 * Appointment status as per AppointmentAttribute model
 * Controls the lifecycle of an appointment booking
 */
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULED";

/**
 * Appointment mode (in-person, telemedicine, etc.)
 * From AppointmentMode model
 */
export interface AppointmentMode {
    id: number;
    name: string;
    description: string | null;
}

/**
 * Healthcare provider (doctor/specialist)
 * Represents the doctor assigned to an appointment
 */
export interface AppointmentDoctor {
    id: number;
    firstName: string | null;
    lastName: string | null;
    specialization: string | null;
    picture: string | null;
}

/**
 * Clinic information for appointment
 * Shows where the appointment will take place
 */
export interface AppointmentClinic {
    id: number;
    name: string;
    address: string | null;
}

/**
 * Single upcoming/past appointment card
 * Combines data from Appointment + AppointmentAttribute + relationships
 */
export interface UpcomingAppointment {
    id: number;
    caseNumber: string | null;
    subject: string; // Appointment title/subject
    complaint: string | null; // Reason for visit
    status: AppointmentStatus;
    appointmentType: string; // From AppointmentType.name
    doctor: AppointmentDoctor;
    clinic: AppointmentClinic;
    date: Date;
    timeStart: string | null; // e.g., "14:30"
    timeEnd: string | null; // e.g., "15:00"
    appointmentMode: AppointmentMode; // ONLINE or IN-PERSON
    meetingUrl: string | null; // For virtual appointments
    duration: number; // in minutes
    recurring: boolean;
    isActive: boolean;
    attachments?: Array<{
        id: number;
        name: string;
        url: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Paginated list of upcoming appointments
 */
export interface UpcomingAppointmentsData {
    appointments: UpcomingAppointment[];
    total: number;
    hasMore: boolean;
}

/**
 * Simplified appointment card for dashboard display
 * Used in the UpcomingAppointmentsSection component
 */
export interface AppointmentCard {
    id: string;
    doctorName: string;
    specialty: string;
    clinic: string;
    date: Date;
    time: string;
    status: "confirmed" | "pending" | "cancelled";
    type: "in-person" | "telemedicine";
}

// ============================================================================
// HEALTH METRICS TYPES
// ============================================================================

/**
 * Single health metric/vital sign
 * Represents one measurement (BP, heart rate, etc.)
 */
export interface HealthMetric {
    id: string; // unique identifier
    label: string; // "Blood Pressure", "Heart Rate", etc.
    value: string | number;
    unit: string; // "mmHg", "bpm", etc.
    referenceRange?: {
        min: number | string;
        max: number | string;
    };
    trend?: {
        direction: "up" | "down" | "stable";
        value: string | number;
        percentage?: number;
    };
    status: "normal" | "warning" | "critical"; // Color coding
    lastUpdated: Date;
    timestamp?: Date;
}

/**
 * Physical examination with vitals
 * From PhysicalExamination model
 */
export interface HealthMetricsData {
    metrics: HealthMetric[];
    lastUpdated: Date;
    examId?: number; // From PhysicalExamination.id
}

// ============================================================================
// PRESCRIPTIONS TYPES
// ============================================================================

/**
 * Medicine in a prescription
 * From Medicine model
 */
export interface PrescriptionMedicine {
    id: number;
    name: string;
    brandName: string | null;
    genericName: string | null;
    dosage: string | null; // e.g., "500mg"
    frequency: string | null; // e.g., "Twice a day"
    unit: string | null;
    duration: number; // days
    qty: number | null; // quantity
    notes: string | null;
}

/**
 * Single prescription with medicines
 * From Prescription model + Medicine relations
 */
export interface RecentPrescription {
    id: number;
    serialNumber: string | null;
    name: string | null;
    subject: string; // consultation subject
    status: "active" | "archived" | "expired" | "partial";
    prescribedBy: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        specialization: string | null;
    };
    clinic: {
        id: number;
        name: string;
    };
    medicines: PrescriptionMedicine[];
    transactionNumber: string | null;
    isActive: boolean;
    isArchived: boolean;
    dateArchived: Date | null;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Simplified prescription card for dashboard display
 * Used in the PrescriptionsSection component
 */
export interface PrescriptionCard {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    provider: string;
    startDate: Date;
    endDate: Date;
    refillsRemaining: number;
    status: "active" | "expired" | "pending";
}

/**
 * Paginated prescriptions data
 */
export interface RecentPrescriptionsData {
    prescriptions: RecentPrescription[];
    total: number;
    hasMore: boolean;
}

// ============================================================================
// ACTIVITY FEED / TIMELINE TYPES
// ============================================================================

/**
 * Activity types for timeline
 */
export type ActivityType =
    | "appointment_booked"
    | "appointment_completed"
    | "appointment_cancelled"
    | "prescription_created"
    | "lab_request"
    | "imaging_request"
    | "medical_certificate"
    | "consultation_note"
    | "vital_recorded"
    | "document_uploaded";

/**
 * Single activity in timeline
 * Generic type that cabins different activity types
 */
export interface TimelineActivity {
    id: string; // Unique ID
    type: ActivityType;
    title: string; // e.g., "Appointment with Dr. Smith"
    description: string | null;
    timestamp: Date;
    icon?: string; // Icon name for display
    relatedId?: number; // Link to appointment/prescription/etc
    relatedType?: "appointment" | "prescription" | "lab" | "imaging" | "certificate" | "note";
    metadata?: Record<string, any>;
}

/**
 * Patient activity feed/timeline
 */
export interface ActivityFeedData {
    activities: TimelineActivity[];
    total: number;
    hasMore: boolean;
}

// ============================================================================
// ALERT BANNER TYPES
// ============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "error" | "critical";

/**
 * Alert types
 */
export type AlertType =
    | "upcoming_appointment"
    | "prescription_expiry"
    | "laboratory_result"
    | "medication_reminder"
    | "health_warning"
    | "system_notice";

/**
 * Single alert/notification
 */
export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    severity: AlertSeverity;
    actionUrl?: string; // URL to take action
    actionLabel?: string; // e.g., "View Details", "Reschedule"
    dismissible: boolean;
    createdAt: Date;
    metadata?: Record<string, any>;
}

/**
 * Alert banner data
 */
export interface AlertBannerData {
    alerts: Alert[];
    hasNewAlerts: boolean;
    totalAlerts: number;
}

// ============================================================================
// DOCTOR MESSAGES / CONSULTATION NOTES TYPES
// ============================================================================

/**
 * Message from doctor/healthcare provider
 * From ConsultationNote model
 */
export interface DoctorMessage {
    id: number;
    consultationTicketId: number;
    doctorName: string; // From HealthcareProvider
    doctorSpecialization: string | null;
    section: string; // Type of note (consultation, assessment, etc)
    content: string; // Message content
    showOnPatient: boolean; // Visibility to patient
    createdAt: Date;
    doctorId: number;
}

/**
 * Doctor messages preview
 */
export interface DoctorMessagesData {
    messages: DoctorMessage[];
    total: number;
    hasMore: boolean;
}

// ============================================================================
// DASHBOARD SUMMARY TYPES
// ============================================================================

/**
 * Patient dashboard summary stats
 */
export interface DashboardStats {
    upcomingAppointmentsCount: number;
    activePrescriptionsCount: number;
    labResultsCount: number;
    healthScore: number; // 0-100
}

/**
 * Complete patient dashboard data
 * Combines all sections
 */
export interface PatientDashboardData {
    patient: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        email: string;
        picture: string | null;
    };
    stats: DashboardStats;
    upcomingAppointments: UpcomingAppointmentsData;
    healthMetrics: HealthMetricsData;
    prescriptions: RecentPrescriptionsData;
    activityFeed: ActivityFeedData;
    alerts: AlertBannerData;
    doctorMessages: DoctorMessagesData;
    lastUpdated: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API response wrapper for dashboard data
 */
export interface DashboardApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: Date;
}

/**
 * Component loading/error states
 */
export interface ComponentState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    isEmpty: boolean;
}

/**
 * Pagination params
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

/**
 * Date range filter
 */
export interface DateRange {
    from: Date;
    to: Date;
}
