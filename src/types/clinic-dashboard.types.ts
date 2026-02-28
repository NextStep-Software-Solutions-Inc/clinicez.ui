export interface ClinicDashboardMetrics {
    patientsToday: number;
    pendingAppointments: number;
    totalAppointmentsToday: number;
    totalConsultations: number;
    completedAppointmentsToday: number;
}

export interface ActivityItemData {
    id?: number;
    action: string;
    detail: string;
    detail2?: string;
    time?: Date;
    icon: string;
}

export interface ClinicDashboardRecentActivity {
    appointments: ActivityItemData[];
    newPatients: Omit<ActivityItemData, "id" | "time">[];
}

export interface DiagnosticRequestStats {
    referrals: number;
    labRequests: number;
    imagingRequests: number;
    heartRequests: number;
}

export interface ConsultationDetail {
    id: number;
    subject: string;
    createdAt: Date;
    status: string;
}

export interface WorkloadData {
    activeConsultations: number;
    consultationDetails: ConsultationDetail[];
}

export interface UpcomingAppointment {
    id: number;
    subject: string;
    date?: Date | null;
    timeStart?: string | null;
    timeEnd?: string | null;
}

export interface ScheduleOverview {
    upcomingCount: number;
    upcomingAppointments: UpcomingAppointment[];
}

export interface TeamMember {
    id: number;
    name: string;
    role: string;
    avatar?: string | null;
}

export interface TeamStatusData {
    totalMembers: number;
    members: TeamMember[];
}

export interface ClinicDashboardData {
    clinic: {
        id: number;
        clinicUid: string;
        name: string;
    };
    metrics: ClinicDashboardMetrics;
    diagnosticRequests: DiagnosticRequestStats;
    workload: WorkloadData;
    schedule: ScheduleOverview;
    teamStatus: TeamStatusData;
    recentActivity: ClinicDashboardRecentActivity;
}
